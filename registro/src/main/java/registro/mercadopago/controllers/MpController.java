package registro.mercadopago.controllers;

import registro.mercadopago.config.MpProperties;
import registro.mercadopago.dtos.*;
import registro.mercadopago.models.MpAccountLink;
import registro.mercadopago.models.MpWalletMovement;
import registro.mercadopago.models.MpImportedPayment;
import registro.mercadopago.repositories.MpPaymentRepository;
import registro.mercadopago.repositories.MpWalletMovementRepository;
import registro.mercadopago.repositories.MpImportedPaymentRepository;
import registro.mercadopago.services.MpAuthService;
import registro.mercadopago.services.MpBillingService;
import registro.mercadopago.services.MpPaymentImportService;
import registro.mercadopago.services.util.MpWalletMovementImportService;
import registro.cargarDatos.models.Movimiento;
import registro.cargarDatos.models.TipoMedioPago;
import registro.cargarDatos.repositories.MovimientoRepository;
import registro.services.AdministracionService;

import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

/**
 * Controlador de integraciones con Mercado Pago:
 * - OAuth
 * - Importación y listado de Pagos (payments)
 * - Importación y listado de Movimientos de Billetera (wallet/account movements)
 * - Facturación y desvinculación
 */
@RestController
@RequestMapping("/api/mp")
public class MpController {

    private final MpAuthService auth;
    private final MpPaymentImportService importer;
    private final MpBillingService billing;
    private final MpPaymentRepository paymentRepo;

    // Wallet movements
    private final MpWalletMovementImportService walletImporter;
    private final MpWalletMovementRepository walletRepo;
    
    // Imported payments
    private final MpImportedPaymentRepository mpImportedRepo;

    @Autowired
    private MovimientoRepository MovimientoRepo;

    @Autowired
    private MpProperties mpProps;

    @Autowired
    private AdministracionService administracionService;

    public MpController(
            MpAuthService auth,
            MpPaymentImportService importer,
            MpBillingService billing,
            MpPaymentRepository paymentRepo,
            MpWalletMovementImportService walletImporter,
            MpWalletMovementRepository walletRepo,
            MpImportedPaymentRepository mpImportedRepo
    ) {
        this.auth = auth;
        this.importer = importer;
        this.billing = billing;
        this.paymentRepo = paymentRepo;
        this.walletImporter = walletImporter;
        this.walletRepo = walletRepo;
        this.mpImportedRepo = mpImportedRepo;
    }

    // En tu proyecto real obtendrás el userId del token/JWT.
    private String getCurrentUserUuid(String usuarioSub) {
        String value = requireUsuarioSub(usuarioSub).trim();
        try {
            UUID.fromString(value);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El header X-Usuario-Sub debe ser un UUID v\u00e1lido");
        }
        return value;
    }

    /* ======================
       OAuth
       ====================== */

    @GetMapping("/oauth/url")
    public Map<String, String> getOauthUrl(@RequestHeader("X-Usuario-Sub") String usuarioSub) {
        String url = auth.buildAuthorizationUrl(null, getCurrentUserUuid(usuarioSub));
        System.out.println(">>> URL de autorización generada: " + url);
        return Map.of("url", url);
    }

    @GetMapping("/oauth/callback")
    public ResponseEntity<Void> callback(@RequestParam String code, @RequestParam String state, @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSub) {
        String base = Optional.ofNullable(mpProps.getFrontendUrl())
                .orElseThrow(() -> new IllegalStateException("mercadopago.frontend-url no está configurado"));
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        try {
            String userId = usuarioSub != null && !usuarioSub.isBlank()
                    ? getCurrentUserUuid(usuarioSub)
                    : extractUserIdFromState(state);
            auth.handleCallback(code, state, userId);
            // HashRouter (React) requiere "#/"
            String target = base + "/#/mercado-pago?linked=1";
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(target)).build();
        } catch (Exception e) {
            e.printStackTrace();
            String reason = java.net.URLEncoder.encode(
                    Optional.ofNullable(e.getMessage()).orElse("callback_error"),
                    java.nio.charset.StandardCharsets.UTF_8
            );
            String err = base + "/#/mercado-pago?mp=error&reason=" + reason;
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(err)).build();
        }
    }

    /* ======================
       Estado
       ====================== */

    @GetMapping("/status")
    public ResponseEntity<OauthStatusDTO> status(@RequestHeader("X-Usuario-Sub") String usuarioSub) {
        String userId = getCurrentUserUuid(usuarioSub);
        return ResponseEntity.ok(auth.getStatus(userId));
    }

    /* ======================
       Preview de PAGOS (sin guardar)
       ====================== */

    @PostMapping("/preview")
    public Map<String, Object> previewPagos(
            @RequestBody ImportRequest req,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        final String usuarioActual = getCurrentUserUuid(usuarioSub);
        final String uid = usuarioActual;
        List<PaymentDTO> previewData;

        if (req.getPaymentId() != null) {
            System.out.println("[/preview] by paymentId=" + req.getPaymentId());
            previewData = importer.previewPaymentById(uid, req.getPaymentId(), usuarioActual);
        } else if (req.getExternalReference() != null && !req.getExternalReference().isBlank()) {
            System.out.println("[/preview] by externalReference=" + req.getExternalReference());
            previewData = importer.previewByExternalReference(uid, req.getExternalReference().trim(), usuarioActual);
        } else if (req.getMonth() != null && req.getYear() != null) {
            System.out.println("[/preview] by month/year " + req.getMonth() + "/" + req.getYear());
            previewData = importer.previewByMonth(uid, req.getMonth(), req.getYear(), usuarioActual);
        } else {
            throw new IllegalArgumentException("Debes indicar paymentId, externalReference o month/year");
        }

        return Map.of(
            "preview", previewData,
            "total", previewData.size(),
            "message", "Datos de preview obtenidos. Selecciona cuáles guardar."
        );
    }

    /* ======================
       Importación de PAGOS (guardar seleccionados)
       ====================== */

    @PostMapping("/import")
    public Map<String, Object> importPagos(
            @RequestBody ImportRequest req,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        final String usuarioActual = getCurrentUserUuid(usuarioSub);
        final String uid = usuarioActual;
        int cant;

        if (req.getPaymentId() != null) {
            System.out.println("[/import] by paymentId=" + req.getPaymentId());
            cant = importer.importPaymentById(uid, req.getPaymentId(), usuarioActual);
        } else if (req.getExternalReference() != null && !req.getExternalReference().isBlank()) {
            System.out.println("[/import] by externalReference=" + req.getExternalReference());
            cant = importer.importByExternalReference(uid, req.getExternalReference().trim(), usuarioActual);
        } else if (req.getMonth() != null && req.getYear() != null) {
            System.out.println("[/import] by month/year " + req.getMonth() + "/" + req.getYear());
            cant = importer.importByMonth(uid, req.getMonth(), req.getYear(), usuarioActual);
        } else {
            throw new IllegalArgumentException("Debes indicar paymentId, externalReference o month/year");
        }

        return Map.of("importados", cant);
    }

    /* ======================
       Importación de PAGOS seleccionados
       ====================== */

    @PostMapping("/import/selected")
    public Map<String, Object> importPagosSeleccionados(
            @RequestBody List<Long> paymentIds,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        final String usuarioActual = getCurrentUserUuid(usuarioSub);
        final String uid = usuarioActual;
        int cant = importer.importSelectedPayments(uid, paymentIds, usuarioActual);
        return Map.of("importados", cant);
    }

    /* ======================
       Listado de PAGOS (desde Registro)
       ====================== */
    @GetMapping("/payments")
    public Page<PaymentDTO> payments(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 10, sort = "fechaEmision", direction = Sort.Direction.DESC) Pageable pg,
            @RequestHeader("X-Usuario-Sub") String usuarioSub
    ) {
        final String usuarioActual = getCurrentUserUuid(usuarioSub);
        final Long organizacionId = resolveOrganizacionId(usuarioActual);

        // Verificar que el usuario tenga cuenta vinculada
        MpAccountLink accountLink = auth.getAccountLink(usuarioActual);
        if (accountLink == null) {
            return Page.empty();
        }

        Specification<Movimiento> spec = (root, query, cb) -> {
            List<Predicate> ands = new ArrayList<>();
            
            // Filtrar solo registros de MercadoPago del usuario actual
            ands.add(cb.equal(root.get("medioPago"), TipoMedioPago.MercadoPago));
            ands.add(cb.equal(root.get("organizacionId"), organizacionId));
            ands.add(cb.equal(root.get("usuarioId"), usuarioActual));
            

            if (from != null) {
                ands.add(cb.greaterThanOrEqualTo(root.get("fechaEmision"), from.atStartOfDay()));
            }
            if (to != null) {
                ands.add(cb.lessThan(root.get("fechaEmision"), to.plusDays(1).atStartOfDay()));
            }
            if (q != null && !q.isBlank()) {
                String ql = "%" + q.toLowerCase().trim() + "%";
                Predicate or = cb.or(
                        cb.like(cb.lower(root.get("descripcion")), ql),
                        cb.like(cb.lower(root.get("origenNombre")), ql),
                        cb.like(cb.lower(root.get("destinoNombre")), ql),
                        cb.like(cb.lower(root.get("categoria")), ql)
                );
                ands.add(or);
            }
            return cb.and(ands.toArray(new Predicate[0]));
        };

        Pageable sorted = normalizeSortRegistros(pg);
        Page<Movimiento> page = MovimientoRepo.findAll(spec, sorted);

        return page.map(r -> {
            PaymentDTO dto = new PaymentDTO();
            // Campos principales para la tabla
            dto.setCategoria(r.getCategoria());
            dto.setDescripcion(r.getDescripcion());
            dto.setFecha(r.getFechaEmision() != null ? r.getFechaEmision().toLocalDate() : null);
            dto.setOrigen(r.getOrigenNombre()); // DTO usa 'origen' pero mapea desde origenNombre
            dto.setMontoTotal(BigDecimal.valueOf(r.getMontoTotal()));
            dto.setTipo(r.getTipo() != null ? r.getTipo().toString() : "UNKNOWN");
            
            // Campos adicionales
            dto.setMoneda(r.getMoneda() != null ? r.getMoneda().toString() : null);
            dto.setEstado(r.getTipo() != null ? r.getTipo().toString() : "UNKNOWN");
            
            // ID del registro para poder actualizar la categoría
            dto.setId(r.getId());
            
            return dto;
        });
    }

    /* ======================
       Listado de PAGOS IMPORTADOS (desde MpImportedPayment)
       ====================== */
    @GetMapping("/imported-payments")
    public Page<PaymentDTO> importedPayments(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 10, sort = "fechaEmision", direction = Sort.Direction.DESC) Pageable pg,
            @RequestHeader("X-Usuario-Sub") String usuarioSub
    ) {
        final String usuarioActual = getCurrentUserUuid(usuarioSub);
        final UUID usuarioUuid = parseUsuarioUuid(usuarioActual);
        resolveOrganizacionId(usuarioActual); // valida empresa asociada
        System.out.println(">>> [IMPORTED-PAYMENTS] Endpoint llamado para usuario: " + usuarioActual);

        // Verificar que el usuario tenga cuenta vinculada
        MpAccountLink accountLink = auth.getAccountLink(usuarioActual);
        if (accountLink == null) {
            System.out.println(">>> [IMPORTED-PAYMENTS] No hay cuenta vinculada");
            return Page.empty();
        }

        Specification<MpImportedPayment> spec = (root, query, cb) -> {
            List<Predicate> ands = new ArrayList<>();
            
            // Filtrar solo pagos importados del usuario actual
            ands.add(cb.equal(root.get("usuarioId"), usuarioUuid));
            
            // Filtrar por cuenta de MP si se especifica
            if (accountId != null) {
                ands.add(cb.equal(root.get("mpAccountId"), accountId.toString()));
            }

            if (from != null) {
                ands.add(cb.greaterThanOrEqualTo(root.get("fechaEmision"), from));
            }
            if (to != null) {
                ands.add(cb.lessThan(root.get("fechaEmision"), to.plusDays(1)));
            }
            if (q != null && !q.isBlank()) {
                String ql = "%" + q.toLowerCase().trim() + "%";
                Predicate or = cb.or(
                        cb.like(cb.lower(root.get("descripcion")), ql),
                        cb.like(cb.lower(root.get("description")), ql),
                        cb.like(cb.lower(root.get("origen")), ql),
                        cb.like(cb.lower(root.get("categoria")), ql)
                );
                ands.add(or);
            }
            return cb.and(ands.toArray(new Predicate[0]));
        };

        Pageable normalizedPageable = normalizeSortImportedPayments(pg);
        Page<MpImportedPayment> page = mpImportedRepo.findAll(spec, normalizedPageable);
        
        System.out.println(">>> [IMPORTED-PAYMENTS] Total elementos encontrados: " + page.getTotalElements());
        System.out.println(">>> [IMPORTED-PAYMENTS] Elementos en esta página: " + page.getContent().size());

        return page.map(mp -> {
            PaymentDTO dto = new PaymentDTO();
            // Campos principales para la tabla
            dto.setCategoria(mp.getCategoria());
            dto.setDescripcion(mp.getDescripcion());
            dto.setFecha(mp.getFechaEmision());
            dto.setOrigen(mp.getOrigen());
            dto.setMontoTotal(mp.getMontoTotal());
            dto.setTipo(mp.getTipo() != null ? mp.getTipo().toString() : "UNKNOWN");
            
            // Campos adicionales
            dto.setMoneda(mp.getMoneda() != null ? mp.getMoneda().toString() : null);
            dto.setEstado(mp.getStatus());
            
            // ID del registro para poder actualizar la categoría
            dto.setId(mp.getRegistroId());
            
            // ID del pago de MercadoPago
            dto.setMpPaymentId(Long.valueOf(mp.getMpPaymentId()));
            
            return dto;
        });
    }

    /* ======================
       Importación de MOVIMIENTOS (Billetera)
       ====================== */

    // Importar por rango (inclusive)
    @PostMapping("/wallet/import")
    public Map<String, Object> importWallet(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestHeader("X-Usuario-Sub") String usuarioSub
    ) {
        int n = walletImporter.importRange(getCurrentUserUuid(usuarioSub), from, to);
        return Map.of("importados", n);
    }

    // Importar por “N° de movimiento” (string alfanumérico tipo B31HQ7A…)
    @PostMapping("/wallet/importById")
    public Map<String, Object> importWalletById(@RequestParam String movementId,
                                               @RequestHeader("X-Usuario-Sub") String usuarioSub) {
        int n = walletImporter.importByMovementId(getCurrentUserUuid(usuarioSub), movementId);
        return Map.of("importados", n);
    }

    // Listar movimientos paginados + filtros
    @GetMapping("/wallet/movements")
    public Page<WalletMovementDTO> listWallet(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "dateEvent", direction = Sort.Direction.DESC) Pageable pg,
            @RequestHeader("X-Usuario-Sub") String usuarioSub
    ) {
        final String userId = getCurrentUserUuid(usuarioSub);
        final ZoneId zone = ZoneId.systemDefault();

        Specification<MpWalletMovement> spec = (root, query, cb) -> {
            List<Predicate> ands = new ArrayList<>();
            ands.add(cb.equal(root.get("accountLink").get("userIdApp"), userId));

            if (from != null) {
                ands.add(cb.greaterThanOrEqualTo(root.get("dateEvent"), from.atStartOfDay(zone).toInstant()));
            }
            if (to != null) {
                ands.add(cb.lessThan(root.get("dateEvent"), to.plusDays(1).atStartOfDay(zone).toInstant()));
            }
            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase().trim() + "%";
                ands.add(cb.or(
                        cb.like(cb.lower(root.get("mpMovementId")), like),
                        cb.like(cb.lower(root.get("description")), like),
                        cb.like(cb.lower(root.get("kind")), like),
                        cb.like(cb.lower(root.get("status")), like)
                ));
            }
            return cb.and(ands.toArray(new Predicate[0]));
        };

        Page<MpWalletMovement> page = walletRepo.findAll(spec, pg);

        return page.map(m -> {
            WalletMovementDTO dto = new WalletMovementDTO();
            dto.setMovementId(m.getMpMovementId());
            dto.setFecha(m.getDateEvent() != null ? m.getDateEvent().atZone(zone).toLocalDate() : null);
            dto.setMonto(m.getAmount());
            dto.setMoneda(m.getCurrency());
            dto.setTipo(m.getKind());
            dto.setDescripcion(m.getDescription());
            dto.setEstado(m.getStatus());
            return dto;
        });
    }

    /* ======================
       Facturación
       ====================== */

    @PostMapping("/facturar")
    public FacturarResponse facturar(@RequestBody FacturarRequest req,
                                     @RequestHeader("X-Usuario-Sub") String usuarioSub) {
        return billing.facturarPagos(getCurrentUserUuid(usuarioSub), req.getPaymentIds());
    }

    /* ======================
       Desvincular
       ====================== */

    @PostMapping("/unlink")
    public ResponseEntity<Void> unlink(@RequestHeader("X-Usuario-Sub") String usuarioSub) {
        auth.unlink(getCurrentUserUuid(usuarioSub)); // asegurate de implementarlo en el service
        return ResponseEntity.noContent().build();
    }

    /* ======================
       Debug/Test endpoints
       ====================== */
    
    @GetMapping("/debug/imported-count")
    public Map<String, Object> debugImportedCount() {
        long totalCount = mpImportedRepo.count();
        System.out.println(">>> [DEBUG] Total registros en mp_imported_payments: " + totalCount);
        
        return Map.of(
            "totalImportedPayments", totalCount,
            "message", "Debug endpoint - verificar datos en mp_imported_payments"
        );
    }

    private String extractUserIdFromState(String state) {
        if (state == null || state.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "state es requerido");
        }
        try {
            String decoded = new String(java.util.Base64.getUrlDecoder().decode(state), java.nio.charset.StandardCharsets.UTF_8);
            String[] parts = decoded.split(":");
            if (parts.length < 2 || parts[0].isBlank()) {
                throw new IllegalArgumentException("state invalido");
            }
            return getCurrentUserUuid(parts[0]);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "state invalido", e);
        }
    }

    /* ======================
       Helpers
       ====================== */

    // Mapea sort del DTO (fecha, total, comprador, detalle) a campos de la entidad Registro
    private Pageable normalizeSortRegistros(Pageable pg) {
        if (pg == null) return pg;
        Sort s = pg.getSort();
        if (!s.isSorted()) return pg;

        List<Sort.Order> mapped = new ArrayList<>();
        for (Sort.Order o : s) {
            String prop = o.getProperty();
            switch (prop) {
                case "fecha"     -> prop = "fechaEmision";
                case "total"     -> prop = "montoTotal";
                case "comprador" -> prop = "origen";
                case "detalle"   -> prop = "descripcion";
                // "estado" NO existe en Registro; si viene, podés ignorarlo o redirigirlo:
                case "estado"    -> prop = "fechaEmision";
                default -> {
                    // Si ya viene un nombre válido de entidad (p. ej. "fechaEmision"), lo dejamos tal cual
                }
            }
            mapped.add(new Sort.Order(o.getDirection(), prop));
        }
        return PageRequest.of(pg.getPageNumber(), pg.getPageSize(), Sort.by(mapped));
    }

    // Este helper queda por si en algún endpoint listás MpPayment directamente
    private Pageable normalizeSortPayments(Pageable pg) {
        Sort s = pg.getSort();
        if (!s.isSorted()) {
            s = Sort.by(Sort.Order.desc("dateApproved"));
        } else {
            List<Sort.Order> orders = new ArrayList<>();
            for (Sort.Order o : s) {
                String prop = o.getProperty();
                if ("fecha".equalsIgnoreCase(prop)) prop = "dateApproved"; // mapeo DTO -> entidad MpPayment
                orders.add(new Sort.Order(o.getDirection(), prop));
            }
            s = Sort.by(orders);
        }
        return PageRequest.of(pg.getPageNumber(), pg.getPageSize(), s);
    }

    // Helper para normalizar el sorting de MpImportedPayment
    private Pageable normalizeSortImportedPayments(Pageable pg) {
        if (pg == null) return pg;
        Sort s = pg.getSort();
        if (!s.isSorted()) return pg;

        List<Sort.Order> mapped = new ArrayList<>();
        for (Sort.Order o : s) {
            String prop = o.getProperty();
            switch (prop) {
                case "fecha"     -> prop = "fechaEmision";
                case "total"     -> prop = "montoTotal";
                case "comprador" -> prop = "origen";
                case "detalle"   -> prop = "descripcion";
                case "estado"    -> prop = "status";
                default -> {
                    // Si ya viene un nombre válido de entidad, lo dejamos tal cual
                }
            }
            mapped.add(new Sort.Order(o.getDirection(), prop));
        }
        return PageRequest.of(pg.getPageNumber(), pg.getPageSize(), Sort.by(mapped));
    }

    private String requireUsuarioSub(String usuarioSub) {
        if (usuarioSub == null || usuarioSub.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El header X-Usuario-Sub es obligatorio");
        }
        return usuarioSub;
    }

    private Long resolveOrganizacionId(String usuarioSub) {
        Long organizacionId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        if (organizacionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario no tiene empresa asociada");
        }
        return organizacionId;
    }

    private UUID parseUsuarioUuid(String usuarioSub) {
        try {
            return UUID.fromString(usuarioSub);
        } catch (IllegalArgumentException ex) {
            return UUID.nameUUIDFromBytes(usuarioSub.getBytes(StandardCharsets.UTF_8));
        }
    }

    /**
     * Actualiza la categoría de un registro de MercadoPago
     */
    @PutMapping("/payments/{registroId}/category")
    public Map<String, Object> updatePaymentCategory(
            @PathVariable Long registroId,
            @RequestBody Map<String, String> request,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {
        final String uid = getCurrentUserUuid(usuarioSub);
        String newCategory = request.get("categoria");
        
        if (newCategory == null || newCategory.trim().isEmpty()) {
            throw new IllegalArgumentException("La categoría no puede estar vacía");
        }
        
        int updated = importer.updatePaymentCategory(uid, registroId, newCategory.trim());
        
        if (updated == 0) {
            throw new IllegalArgumentException("No se encontró el registro o no tienes permisos para modificarlo");
        }
        
        return Map.of(
            "success", true,
            "message", "Categoría actualizada exitosamente",
            "updated", updated
        );
    }
}
