package registro.mercadopago.services.impl;

import registro.cargarDatos.models.*;
import registro.cargarDatos.repositories.MovimientoRepository;
import registro.mercadopago.config.MpProperties;
import registro.mercadopago.dtos.PaymentDTO;
import registro.mercadopago.models.MpAccountLink;
import registro.mercadopago.models.MpImportedPayment;
import registro.mercadopago.repositories.MpAccountLinkRepository;
import registro.mercadopago.repositories.MpImportedPaymentRepository;
import registro.mercadopago.services.MpDuplicateDetectionService;
import registro.mercadopago.services.MpPaymentImportService;
import registro.movimientosexcel.services.CategorySuggestionService;
import registro.services.AdministracionService;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;

@Service
public class MpPaymentImportServiceImpl implements MpPaymentImportService {

    private final MovimientoRepository movimientoRepo;
    private final MpAccountLinkRepository linkRepo;
    private final MpImportedPaymentRepository mpImportedRepo;
    private final MpProperties props;
    private final CategorySuggestionService categorySuggestionService;
    private final MpDuplicateDetectionService duplicateDetectionService;
    private final AdministracionService administracionService;

    private final RestTemplate rest = new RestTemplate();

    public MpPaymentImportServiceImpl(
            MovimientoRepository movimientoRepo,
            MpAccountLinkRepository linkRepo,
            MpImportedPaymentRepository mpImportedRepo,
            MpProperties props,
            CategorySuggestionService categorySuggestionService,
            MpDuplicateDetectionService duplicateDetectionService,
            AdministracionService administracionService
    ) {
        this.movimientoRepo = movimientoRepo;
        this.linkRepo = linkRepo;
        this.mpImportedRepo = mpImportedRepo;
        this.props = props;
        this.categorySuggestionService = categorySuggestionService;
        this.duplicateDetectionService = duplicateDetectionService;
        this.administracionService = administracionService;
    }

    /* =========================
       Métodos públicos
       ========================= */

    @Override
    public int importPaymentById(String userIdApp, Long paymentId, String usuarioSub) {
        TenantContext tenant = resolveTenant(usuarioSub);
        MpAccountLink link = requireLink(userIdApp);
        Map<String, Object> body = get("/v1/payments/" + paymentId, link.getAccessToken());
        if (body == null || body.isEmpty()) return 0;
        upsertRegistro(body, link, tenant);
        return 1;
    }

    @Override
    public int importByMonth(String userIdApp, int month, int year, String usuarioSub) {
        TenantContext tenant = resolveTenant(usuarioSub);
        MpAccountLink link = requireLink(userIdApp);

        ZoneId zone = ZoneId.systemDefault();
        LocalDate first = LocalDate.of(year, month, 1);
        LocalDate last = first.withDayOfMonth(first.lengthOfMonth());

        Instant from = first.atStartOfDay(zone).toInstant();
        Instant to = last.plusDays(1).atStartOfDay(zone).toInstant(); // exclusivo

        int imported = 0;
        int offset = 0;
        final int limit = 50;
        final int maxPages = 20; // tope de 1000 items

        for (int page = 0; page < maxPages; page++, offset += limit) {
            List<Map<String, Object>> results = searchPaymentsPageNoDates(link.getAccessToken(), offset, limit);
            if (results.isEmpty()) break;

            boolean reachedOlder = false;
            for (Map<String, Object> p : results) {
                Instant approved = parseInstant(p.get("date_approved"));
                if (approved == null) approved = parseInstant(p.get("date_created"));

                if (approved == null || approved.isBefore(from)) {
                    reachedOlder = true;
                    continue;
                }
                if (approved.isBefore(to)) {
                    upsertRegistro(p, link, tenant);
                    imported++;
                }
            }
            if (reachedOlder) break;
        }
        return imported;
    }

    @Override
    public int importByExternalReference(String userIdApp, String externalRef, String usuarioSub) {
        TenantContext tenant = resolveTenant(usuarioSub);
        MpAccountLink link = requireLink(userIdApp);
        int imported = 0;

        // A) Intento directo por payments/search
        String url = props.getApiBase()
                + "/v1/payments/search?external_reference=" + enc(externalRef)
                + "&sort=date_approved&criteria=desc&limit=50";
        try {
            HttpEntity<Void> req = new HttpEntity<>(authHeaders(link.getAccessToken()));
            ResponseEntity<Map> res = rest.exchange(url, HttpMethod.GET, req, Map.class);
            Object rs = (res.getBody() != null) ? res.getBody().get("results") : null;
            if (rs instanceof List<?> list) {
                for (Object o : list) {
                    if (o instanceof Map<?, ?> m) {
                        upsertRegistro((Map<String, Object>) m, link, tenant);
                        imported++;
                    }
                }
            }
            if (imported > 0) return imported;
        } catch (HttpStatusCodeException e) {
            System.err.println("payments/search by external_reference -> " + e.getStatusCode());
            System.err.println("URL: " + url);
            System.err.println("Body: " + e.getResponseBodyAsString());
        }

        // B) merchant_orders/search
        imported += importViaMerchantOrders(link, externalRef, tenant);

        // C) búsqueda laxa
        imported += importByLooseQuery(link, externalRef, tenant);

        return imported;
    }

    /* =========================
       Métodos privados
       ========================= */

    @SuppressWarnings("unchecked")
    private int importViaMerchantOrders(MpAccountLink link, String externalRef, TenantContext tenant) {
        String url = props.getApiBase()
                + "/merchant_orders/search?external_reference=" + enc(externalRef)
                + "&limit=10";
        int imported = 0;

        try {
            HttpEntity<Void> req = new HttpEntity<>(authHeaders(link.getAccessToken()));
            ResponseEntity<Map> res = rest.exchange(url, HttpMethod.GET, req, Map.class);
            Object rs = (res.getBody() != null) ? res.getBody().get("elements") : null;
            if (rs instanceof List<?> list) {
                for (Object ord : list) {
                    if (ord instanceof Map<?, ?> mo) {
                        Object pays = mo.get("payments");
                        if (pays instanceof List<?> pl) {
                            for (Object p : pl) {
                                if (p instanceof Map<?, ?> pm) {
                                    Long pid = asLong(((Map<String, Object>) pm).get("id"));
                                    if (pid != null) {
                                        Map<String, Object> full = get("/v1/payments/" + pid, link.getAccessToken());
                                        if (full != null && !full.isEmpty()) {
                                            upsertRegistro(full, link, tenant);
                                            imported++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (HttpStatusCodeException e) {
            System.err.println("merchant_orders/search -> " + e.getStatusCode());
            System.err.println("URL: " + url);
            System.err.println("Body: " + e.getResponseBodyAsString());
        }
        return imported;
    }

    @SuppressWarnings("unchecked")
    private int importByLooseQuery(MpAccountLink link, String query, TenantContext tenant) {
        String url = props.getApiBase()
                + "/v1/payments/search?q=" + enc(query) + "&limit=50";
        int imported = 0;
        try {
            HttpEntity<Void> req = new HttpEntity<>(authHeaders(link.getAccessToken()));
            ResponseEntity<Map> res = rest.exchange(url, HttpMethod.GET, req, Map.class);
            Object rs = (res.getBody() != null) ? res.getBody().get("results") : null;
            if (rs instanceof List<?> list) {
                for (Object o : list) {
                    if (o instanceof Map<?, ?> m) {
                        upsertRegistro((Map<String, Object>) m, link, tenant);
                        imported++;
                    }
                }
            }
        } catch (HttpStatusCodeException e) {
            System.err.println("payments/search?q= -> " + e.getStatusCode());
            System.err.println("URL: " + url);
            System.err.println("Body: " + e.getResponseBodyAsString());
        }
        return imported;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> searchPaymentsPageNoDates(String accessToken, int offset, int limit) {
        HttpEntity<Void> req = new HttpEntity<>(authHeaders(accessToken));
        String url = props.getApiBase() + "/v1/payments/search"
                + "?sort=date_approved&criteria=desc"
                + "&offset=" + offset + "&limit=" + limit;
        try {
            ResponseEntity<Map> res = rest.exchange(url, HttpMethod.GET, req, Map.class);
            Object rs = (res.getBody() != null) ? res.getBody().get("results") : null;
            return (rs instanceof List) ? (List<Map<String, Object>>) rs : List.of();
        } catch (HttpStatusCodeException e) {
            System.err.println("payments/search (no dates) -> " + e.getStatusCode());
            System.err.println("URL: " + url);
            System.err.println("Body: " + e.getResponseBodyAsString());
            return List.of();
        }
    }

    private MpAccountLink requireLink(String userIdApp) {
        return linkRepo.findByUserIdApp(userIdApp)
                .orElseThrow(() -> new IllegalStateException("No hay cuenta vinculada de Mercado Pago para el usuario"));
    }

    private TenantContext resolveTenant(String usuarioSub) {
        if (usuarioSub == null || usuarioSub.isBlank()) {
            throw new IllegalArgumentException("El usuario en sesión es requerido para importar pagos de Mercado Pago");
        }
        Long organizacionId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        if (organizacionId == null) {
            throw new IllegalStateException("El usuario en sesión no tiene una empresa asociada");
        }
        return new TenantContext(usuarioSub, organizacionId, parseUsuarioUuid(usuarioSub));
    }

    private UUID parseUsuarioUuid(String usuarioSub) {
        try {
            return UUID.fromString(usuarioSub);
        } catch (IllegalArgumentException ex) {
            return UUID.nameUUIDFromBytes(usuarioSub.getBytes(StandardCharsets.UTF_8));
        }
    }

    private record TenantContext(String usuarioSub, Long organizacionId, UUID usuarioUuid) {}

    private HttpHeaders authHeaders(String accessToken) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(accessToken);
        h.setAccept(List.of(MediaType.APPLICATION_JSON));
        return h;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> get(String path, String accessToken) {
        String url = props.getApiBase() + path;
        HttpEntity<Void> req = new HttpEntity<>(authHeaders(accessToken));
        try {
            ResponseEntity<Map> res = rest.exchange(url, HttpMethod.GET, req, Map.class);
            return (Map<String, Object>) res.getBody();
        } catch (HttpStatusCodeException e) {
            System.err.println("GET " + url + " -> " + e.getStatusCode());
            System.err.println("Body: " + e.getResponseBodyAsString());
            throw e;
        }
    }

    private void upsertRegistro(Map<String, Object> body, MpAccountLink link, TenantContext tenant) {
        // === 1) Parseos base ===

        // fechas: fechaEmision = date_created (LocalDateTime)
        Instant dateCreated = parseInstant(body.get("date_created"));   // p.ej. "2025-07-05T14:12:33.000-03:00"
        LocalDateTime fechaEmision = (dateCreated != null)
                ? dateCreated.atZone(ZoneId.systemDefault()).toLocalDateTime()
                : LocalDateTime.now();

        // historial
        // fechaCreacion = date_created ; fechaActualizacion = imported_at (si viene), si no = hoy
        Instant importedAt = parseInstant(body.get("imported_at")); // puede no estar en el payload
        LocalDateTime fechaCreacion = (dateCreated != null)
                ? dateCreated.atZone(ZoneId.systemDefault()).toLocalDateTime()
                : LocalDateTime.now();
        LocalDateTime fechaActualizacion = (importedAt != null)
                ? importedAt.atZone(ZoneId.systemDefault()).toLocalDateTime()
                : LocalDateTime.now();

        // monto/moneda
        BigDecimal transactionAmount = asBigDecimal(body.get("transaction_amount"));
        String currencyId = asString(body.get("currency_id"));

        // otros campos MP
        String description = asString(body.get("description"));
        String payerEmail = getPayerEmail(body); // como ya lo tenías
        String status = asString(body.get("status")); // approved, refunded, cancelled, etc.
        String transactionType = asString(body.get("transaction_type")); // money_in, money_out, etc.
        String operationType = asString(body.get("operation_type")); // regular_payment, money_transfer, etc.
        
        // Campos para determinar si es ingreso o egreso
        Long payerId = asLong(body.get("payer_id"));
        Long collectorId = asLong(body.get("collector"));
        if (collectorId == null) {
            // Intentar obtener collector_id del objeto collector
            Map<String, Object> collector = asMap(body.get("collector"));
            if (collector != null) {
                collectorId = asLong(collector.get("id"));
            }
        }
        
        // Log completo del pago para debug
        System.out.println(">>> === IMPORTANDO PAGO ===");
        System.out.println(">>> ID: " + asLong(body.get("id")));
        System.out.println(">>> Status: " + status);
        System.out.println(">>> TransactionType: " + transactionType);
        System.out.println(">>> OperationType: " + operationType);
        System.out.println(">>> Amount: " + transactionAmount);
        System.out.println(">>> Description: " + description);
        System.out.println(">>> PayerEmail: " + payerEmail);
        System.out.println(">>> PayerID: " + payerId);
        System.out.println(">>> CollectorID: " + collectorId);

        // === 2) Armar Movimiento según tu mapeo ===
        Movimiento r = new Movimiento();

        // id: autogenerado por JPA

        // tipo (tu entidad): clasificación mejorada según múltiples campos de MP
        TipoMovimiento tipoMovimiento = determinarTipoMovimiento(status, transactionType, operationType, transactionAmount, payerId, collectorId);
        r.setTipo(tipoMovimiento);

        // montoTotal = transactionAmount
        r.setMontoTotal(transactionAmount != null ? transactionAmount.doubleValue() : 0d);

        // fechaEmision = date_created
        r.setFechaEmision(fechaEmision);

        // categoria = sugerida inteligentemente según descripción y tipo
        String categoriaSugerida = categorySuggestionService.sugerirCategoria(description, tipoMovimiento);
        r.setCategoria(categoriaSugerida);
        System.out.println(">>> Categoría sugerida: " + categoriaSugerida);

        // origenNombre = payer_email
        r.setOrigenNombre(payerEmail);

        // destinoNombre = NULL (por ahora)
        r.setDestinoNombre(null);

        // descripcion = description + status para mayor claridad
        String descripcionCompleta = description != null ? description : "Pago MercadoPago";
        if (status != null && !status.equalsIgnoreCase("approved")) {
            descripcionCompleta += " [" + status.toUpperCase() + "]";
        }
        r.setDescripcion(descripcionCompleta);

        // historial
        r.setFechaCreacion(fechaCreacion);
        r.setFechaActualizacion(fechaActualizacion);

        // usuario/organización del contexto actual
        r.setUsuarioId(tenant.usuarioSub());
        r.setOrganizacionId(tenant.organizacionId());

        // medioPago = payment_method_id  (es ENUM: puede fallar si el literal no existe)
        // Si tu enum es, por ejemplo, { EFECTIVO, TRANSFERENCIA, MERCADO_PAGO, ... }
        // y el payment_method_id de MP viene como "account_money", "credit_card", etc.,
        // podés:
        //   a) Dejarlo null (como pediste)
        //   b) O mapear algunos casos conocidos:
        r.setMedioPago(TipoMedioPago.MercadoPago); // opción (a)
        // // opción (b) ejemplo:
        // try {
        //     r.setMedioPago(TipoMedioPago.valueOf(paymentMethodId.trim().toUpperCase()));
        // } catch (Exception ignore) {
        //     r.setMedioPago(null);
        // }

        // moneda = currency_id (ENUM)
        // Si tu enum tiene ARS/USD/EUR, esto suele funcionar:
        if (currencyId != null) {
            try {
                r.setMoneda(TipoMoneda.valueOf(currencyId.trim().toUpperCase()));
            } catch (Exception ignore) {
                r.setMoneda(null); // según pediste, dejamos null si no matchea
            }
        } else {
            r.setMoneda(null);
        }

        // documentoComercial = NULL (a futuro)
        r.setDocumentoComercial(null);

        // Nota: mpPaymentId removido temporalmente

        // Normalizar monto según tipo antes de guardar
        normalizarMontoMovimiento(r);

        // === 3) Guardar en tabla Registro ===
        Movimiento savedRegistro = movimientoRepo.save(r);
        
        // === 4) Guardar en tabla MpImportedPayment ===
        String mpPaymentId = asString(body.get("id"));
        UUID usuarioId = tenant.usuarioUuid();
        String mpAccountId = link.getMpUserId(); // ID de la cuenta de MP
        
        MpImportedPayment mpImported = new MpImportedPayment(savedRegistro, mpPaymentId, usuarioId, mpAccountId);
        
        // Copiar datos adicionales de MercadoPago
        mpImported.setDescription(description);
        mpImported.setAmount(transactionAmount);
        mpImported.setCurrencyId(currencyId);
        mpImported.setStatus(status);
        mpImported.setStatusDetail(asString(body.get("status_detail")));
        mpImported.setPaymentMethodId(asString(body.get("payment_method_id")));
        mpImported.setPaymentTypeId(asString(body.get("payment_type_id")));
        mpImported.setExternalReference(asString(body.get("external_reference")));
        
        // Fechas de MercadoPago
        Instant dateApproved = parseInstant(body.get("date_approved"));
        Instant dateLastUpdated = parseInstant(body.get("date_last_updated"));
        
        if (dateCreated != null) {
            mpImported.setDateCreated(dateCreated.atZone(ZoneId.systemDefault()).toLocalDateTime());
        }
        if (dateApproved != null) {
            mpImported.setDateApproved(dateApproved.atZone(ZoneId.systemDefault()).toLocalDateTime());
        }
        if (dateLastUpdated != null) {
            mpImported.setDateLastUpdated(dateLastUpdated.atZone(ZoneId.systemDefault()).toLocalDateTime());
        }
        
        mpImportedRepo.save(mpImported);
        
        // Log final de confirmación
        System.out.println(">>> ✅ PAGO GUARDADO EN AMBAS TABLAS - Tipo: " + r.getTipo() + ", Categoría: " + r.getCategoria());
        System.out.println(">>> Registro ID: " + savedRegistro.getId() + ", MpImported ID: " + mpImported.getId());
        System.out.println(">>> =========================");
    }



    private String getPayerEmail(Map<String, Object> body) {
        Map<String, Object> payer = asMap(body.get("payer"));
        return payer != null ? asString(payer.get("email")) : null;
    }

    /* =========================
       Utils
       ========================= */

    private BigDecimal asBigDecimal(Object o) {
        if (o == null) return null;
        try {
            return (o instanceof BigDecimal b) ? b : new BigDecimal(String.valueOf(o));
        } catch (Exception e) {
            return null;
        }
    }

    private String asString(Object o) {
        return (o == null) ? null : String.valueOf(o);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object o) {
        return (o instanceof Map) ? (Map<String, Object>) o : null;
    }

    private Instant parseInstant(Object o) {
        if (o == null) return null;
        try {
            return OffsetDateTime.parse(String.valueOf(o)).toInstant();
        } catch (Exception e) {
            try {
                return Instant.parse(String.valueOf(o));
            } catch (Exception ignored) {
                return null;
            }
        }
    }

    private Long asLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(String.valueOf(o));
        } catch (Exception e) {
            return null;
        }
    }

    private String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    /**
     * Determina el tipo de registro (INGRESO/EGRESO) basado en múltiples campos de MercadoPago
     * REGLA PRINCIPAL: Si payer_id != collector_id, es un EGRESO (tú pagas a otro)
     */
    private TipoMovimiento determinarTipoMovimiento(String status, String transactionType, String operationType, BigDecimal amount, Long payerId, Long collectorId) {
        System.out.println(">>> === CLASIFICACIÓN DE PAGO ===");
        System.out.println(">>> PayerID: " + payerId + ", CollectorID: " + collectorId);
        
        // 0. REGLA PRINCIPAL: Análisis de relación payer/collector (MÁS CONFIABLE)
        if (payerId != null && collectorId != null && !payerId.equals(collectorId)) {
            System.out.println(">>> ✅ Clasificado como EGRESO por payer != collector (tú pagas a otro)");
            return TipoMovimiento.Egreso;
        }
        
        if (payerId != null && collectorId != null && payerId.equals(collectorId)) {
            System.out.println(">>> ✅ Clasificado como INGRESO por payer == collector (tú recibes)");
            return TipoMovimiento.Ingreso;
        }
        
        // Si no hay IDs, continuar con lógica secundaria
        if (status == null) {
            return TipoMovimiento.Ingreso; // default
        }
        
        String statusLower = status.toLowerCase().trim();
        String transactionTypeLower = transactionType != null ? transactionType.toLowerCase().trim() : "";
        String operationTypeLower = operationType != null ? operationType.toLowerCase().trim() : "";
        
        System.out.println(">>> Usando lógica secundaria - Status: " + status + ", TransactionType: " + transactionType + ", OperationType: " + operationType);
        
        // 1. VERIFICAR SI EL MONTO ES NEGATIVO
        
        // 2. Casos claros de EGRESO (dinero que sale de tu cuenta)
        if (statusLower.equals("refunded") || 
            statusLower.equals("charged_back") || 
            statusLower.equals("chargeback") ||
            transactionTypeLower.equals("money_out") ||
            transactionTypeLower.equals("withdrawal") ||
            transactionTypeLower.equals("transfer") ||
            transactionTypeLower.equals("payout") ||
            transactionTypeLower.equals("disbursement") ||
            operationTypeLower.equals("refund") ||
            operationTypeLower.equals("chargeback") ||
            operationTypeLower.equals("withdrawal") ||
            operationTypeLower.equals("transfer") ||
            operationTypeLower.equals("payout") ||
            operationTypeLower.equals("money_transfer")) {
            System.out.println(">>> Clasificado como EGRESO por tipo de transacción");
            return TipoMovimiento.Egreso;
        }
        
        // 3. Casos claros de INGRESO (dinero que entra a tu cuenta)
        if (statusLower.equals("approved") && 
            (transactionTypeLower.equals("money_in") || 
             transactionTypeLower.equals("payment") ||
             transactionTypeLower.equals("deposit") ||
             operationTypeLower.equals("regular_payment") ||
             operationTypeLower.equals("payment") ||
             operationTypeLower.equals("purchase") ||
             operationTypeLower.equals("deposit") ||
             operationTypeLower.equals("account_fund") ||
             operationTypeLower.equals("recurring_payment"))) {
            System.out.println(">>> Clasificado como INGRESO por tipo de transacción");
            return TipoMovimiento.Ingreso;
        }
        
        // 4. Casos especiales: otros tipos de transferencias
        if (transactionTypeLower.contains("transfer") || 
            operationTypeLower.contains("transfer") ||
            transactionTypeLower.contains("internal") ||
            operationTypeLower.contains("internal")) {
            // Para transferencias, depende del contexto, pero por defecto EGRESO
            System.out.println(">>> Clasificado como EGRESO por transferencia interna");
            return TipoMovimiento.Egreso;
        }
        
        // 5. Casos pendientes o en proceso - analizar por tipo
        if (statusLower.equals("pending") || 
            statusLower.equals("in_process") || 
            statusLower.equals("in_mediation")) {
            // Si es pending pero el tipo indica egreso, clasificar como egreso
            if (transactionTypeLower.equals("money_out") || 
                operationTypeLower.equals("withdrawal") ||
                operationTypeLower.equals("transfer")) {
                System.out.println(">>> Clasificado como EGRESO por estado pendiente con tipo de egreso");
                return TipoMovimiento.Egreso;
            }
            System.out.println(">>> Clasificado como INGRESO por estado pendiente");
            return TipoMovimiento.Ingreso;
        }
        
        // 6. Casos cancelados o rechazados - no afectan el flujo de dinero
        if (statusLower.equals("cancelled") || statusLower.equals("rejected")) {
            System.out.println(">>> Clasificado como INGRESO por estado cancelado/rechazado");
            return TipoMovimiento.Ingreso; // Se puede cambiar a un tipo especial si lo necesitas
        }
        
        // 7. Default: INGRESO (pero con advertencia)
        System.out.println(">>> ⚠️  Clasificado como INGRESO por defecto - revisar manualmente");
        return TipoMovimiento.Ingreso;
    }

    /* =========================
       Métodos de PREVIEW (sin guardar)
       ========================= */

    @Override
    public List<PaymentDTO> previewPaymentById(String userIdApp, Long paymentId, String usuarioSub) {
        TenantContext tenant = resolveTenant(usuarioSub);
        MpAccountLink link = requireLink(userIdApp);
        Map<String, Object> body = get("/v1/payments/" + paymentId, link.getAccessToken());
        if (body == null || body.isEmpty()) return List.of();
        
        PaymentDTO dto = convertToPaymentDTO(body);
        List<PaymentDTO> previewData = List.of(dto);
        
        // Detectar duplicados antes de devolver
        return duplicateDetectionService.detectarDuplicadosEnBD(previewData, tenant.organizacionId());
    }

    @Override
    public List<PaymentDTO> previewByMonth(String userIdApp, int month, int year, String usuarioSub) {
        TenantContext tenant = resolveTenant(usuarioSub);
        MpAccountLink link = requireLink(userIdApp);
        List<PaymentDTO> previewData = new ArrayList<>();

        ZoneId zone = ZoneId.systemDefault();
        LocalDate first = LocalDate.of(year, month, 1);
        LocalDate last = first.withDayOfMonth(first.lengthOfMonth());

        Instant from = first.atStartOfDay(zone).toInstant();
        Instant to = last.plusDays(1).atStartOfDay(zone).toInstant();

        int offset = 0;
        final int limit = 50;
        final int maxPages = 20;

        for (int page = 0; page < maxPages; page++, offset += limit) {
            List<Map<String, Object>> results = searchPaymentsPageNoDates(link.getAccessToken(), offset, limit);
            if (results.isEmpty()) break;

            boolean reachedOlder = false;
            for (Map<String, Object> p : results) {
                Instant approved = parseInstant(p.get("date_approved"));
                if (approved == null) approved = parseInstant(p.get("date_created"));

                if (approved == null || approved.isBefore(from)) {
                    reachedOlder = true;
                    continue;
                }
                if (approved.isBefore(to)) {
                    PaymentDTO dto = convertToPaymentDTO(p);
                    previewData.add(dto);
                }
            }
            if (reachedOlder) break;
        }
        
        // Detectar duplicados antes de devolver
        return duplicateDetectionService.detectarDuplicadosEnBD(previewData, tenant.organizacionId());
    }

    @Override
    public List<PaymentDTO> previewByExternalReference(String userIdApp, String externalRef, String usuarioSub) {
        TenantContext tenant = resolveTenant(usuarioSub);
        MpAccountLink link = requireLink(userIdApp);
        List<PaymentDTO> previewData = new ArrayList<>();

        // Buscar por external_reference
        String url = props.getApiBase()
                + "/v1/payments/search?external_reference=" + enc(externalRef)
                + "&sort=date_approved&criteria=desc&limit=50";
        
        try {
            HttpEntity<Void> req = new HttpEntity<>(authHeaders(link.getAccessToken()));
            ResponseEntity<Map> res = rest.exchange(url, HttpMethod.GET, req, Map.class);
            Object rs = (res.getBody() != null) ? res.getBody().get("results") : null;
            if (rs instanceof List<?> list) {
                for (Object o : list) {
                    if (o instanceof Map<?, ?> m) {
                        PaymentDTO dto = convertToPaymentDTO((Map<String, Object>) m);
                        previewData.add(dto);
                    }
                }
            }
        } catch (HttpStatusCodeException e) {
            System.err.println("Error en preview por external_reference: " + e.getStatusCode());
        }

        // Detectar duplicados antes de devolver
        return duplicateDetectionService.detectarDuplicadosEnBD(previewData, tenant.organizacionId());
    }

    @Override
    public int importSelectedPayments(String userIdApp, List<Long> paymentIds, String usuarioSub) {
        if (paymentIds == null || paymentIds.isEmpty()) {
            return 0;
        }
        TenantContext tenant = resolveTenant(usuarioSub);
        MpAccountLink link = requireLink(userIdApp);
        int imported = 0;

        for (Long paymentId : paymentIds) {
            try {
                Map<String, Object> body = get("/v1/payments/" + paymentId, link.getAccessToken());
                if (body != null && !body.isEmpty()) {
                    upsertRegistro(body, link, tenant);
                    imported++;
                }
            } catch (Exception e) {
                System.err.println("Error importando pago " + paymentId + ": " + e.getMessage());
            }
        }

        return imported;
    }

    /**
     * Convierte un Map de MercadoPago a PaymentDTO para preview
     */
    private PaymentDTO convertToPaymentDTO(Map<String, Object> body) {
        PaymentDTO dto = new PaymentDTO();
        
        // Parsear datos básicos
        Long mpPaymentId = asLong(body.get("id"));
        Instant dateCreated = parseInstant(body.get("date_created"));
        LocalDate fecha = (dateCreated != null) 
            ? dateCreated.atZone(ZoneId.systemDefault()).toLocalDate()
            : LocalDate.now();
        
        BigDecimal transactionAmount = asBigDecimal(body.get("transaction_amount"));
        String currencyId = asString(body.get("currency_id"));
        String description = asString(body.get("description"));
        String payerEmail = getPayerEmail(body);
        String status = asString(body.get("status"));
        String transactionType = asString(body.get("transaction_type"));
        String operationType = asString(body.get("operation_type"));
        
        // Obtener IDs para clasificación correcta en preview
        Long payerId = asLong(body.get("payer_id"));
        Long collectorId = asLong(body.get("collector"));
        if (collectorId == null) {
            Map<String, Object> collector = asMap(body.get("collector"));
            if (collector != null) {
                collectorId = asLong(collector.get("id"));
            }
        }
        
        // Determinar tipo de registro (para preview, CON IDs para clasificación correcta)
        TipoMovimiento tipoMovimiento = determinarTipoMovimiento(status, transactionType, operationType, transactionAmount, payerId, collectorId);
        
        // Mapear a DTO
        dto.setMpPaymentId(mpPaymentId);
        dto.setFecha(fecha);
        dto.setMontoTotal(transactionAmount);
        dto.setDescripcion(description != null ? description : "Pago MercadoPago");
        dto.setOrigen(payerEmail);
        dto.setTipo(tipoMovimiento.toString());
        // Categoría sugerida inteligentemente
        String categoriaSugerida = categorySuggestionService.sugerirCategoria(description, tipoMovimiento);
        dto.setCategoria(categoriaSugerida);
        dto.setMoneda(currencyId);
        dto.setEstado(status);
        
        return dto;
    }

    @Override
    public int updatePaymentCategory(String userIdApp, Long registroId, String newCategory) {
        System.out.println(">>> Actualizando categoría del registro " + registroId + " a: " + newCategory);
        
        // Buscar el registro por su ID
        Optional<Movimiento> registroOpt = movimientoRepo.findById(registroId);
        
        if (registroOpt.isEmpty()) {
            System.out.println(">>> No se encontró registro con ID: " + registroId);
            return 0;
        }
        
        Movimiento registro = registroOpt.get();
        
        // Verificar que el registro pertenece a MercadoPago
        if (registro.getMedioPago() != TipoMedioPago.MercadoPago) {
            System.out.println(">>> El registro no es de MercadoPago");
            return 0;
        }
        
        // Actualizar la categoría en la tabla Registro
        registro.setCategoria(newCategory);
        registro.setFechaActualizacion(LocalDateTime.now());
        movimientoRepo.save(registro);
        
        // Actualizar la categoría en la tabla MpImportedPayment
        MpImportedPayment mpImported = mpImportedRepo.findByRegistroId(registroId);
        if (mpImported != null) {
            mpImported.setCategoria(newCategory);
            mpImportedRepo.save(mpImported);
            System.out.println(">>> Categoría actualizada en ambas tablas exitosamente");
        } else {
            System.out.println(">>> Categoría actualizada en tabla Registro, pero no se encontró en MpImportedPayment");
        }
        
        return 1;
    }
    
    /**
     * Normaliza el monto de un movimiento según su tipo:
     * - Egresos siempre negativos
     * - Ingresos siempre positivos
     */
    private void normalizarMontoMovimiento(Movimiento movimiento) {
        if (movimiento.getMontoTotal() == null || movimiento.getTipo() == null) {
            return;
        }
        
        double monto = movimiento.getMontoTotal();
        
        if (movimiento.getTipo() == TipoMovimiento.Egreso) {
            // Egreso siempre negativo
            if (monto > 0) {
                movimiento.setMontoTotal(-monto);
            }
        } else if (movimiento.getTipo() == TipoMovimiento.Ingreso) {
            // Ingreso siempre positivo
            if (monto < 0) {
                movimiento.setMontoTotal(-monto);
            }
        }
    }
}
