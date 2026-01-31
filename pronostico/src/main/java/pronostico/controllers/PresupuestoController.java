package pronostico.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import pronostico.dtos.CrearPresupuestoRequest;
import pronostico.dtos.PresupuestoDTO;
import pronostico.models.Presupuesto;
import pronostico.models.PresupuestoLinea;
import pronostico.models.PresupuestoLinea.Tipo;
import pronostico.repositories.PresupuestoLineaRepository;
import pronostico.services.AdministracionService;
import pronostico.services.PresupuestoService;
import pronostico.services.PresupuestoService.ListStatus;
import pronostico.services.PresupuestoEventService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PresupuestoController {

    private final PresupuestoService service;
    private final PresupuestoLineaRepository presupuestoLineaRepository;
    private final AdministracionService administracionService;
    private final PresupuestoEventService presupuestoEventService;

    private static final DateTimeFormatter YM = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final Pattern YM_PATTERN = Pattern.compile("^(\\d{4})-(\\d{1,2})(?:-(\\d{1,2}))?$");

    private String normalizeMoneda(String moneda) {
        if (moneda == null || moneda.isBlank()) return null;
        String up = moneda.trim().toUpperCase(Locale.ROOT);
        if (!up.equals("ARS") && !up.equals("USD")) {
            throw new IllegalArgumentException("Moneda inválida. Use ARS o USD.");
        }
        return up;
    }

    @GetMapping("/presupuestos")
    public Page<PresupuestoDTO> getAll(
        @RequestParam(value = "year", required = false) Integer year,
        @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(value = "status", required = false, defaultValue = "active") String statusParam,
        @RequestParam(value = "page", defaultValue = "0") int page,
        @RequestParam(value = "size", defaultValue = "3") int size,
        @RequestParam(value = "sort", defaultValue = "createdAt,desc") String sortParam,
        @RequestParam(value = "moneda", required = false) String moneda,
        @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSubHeader,
        @AuthenticationPrincipal Jwt jwt
    ) {
        RequestContext ctx = resolveContext(usuarioSubHeader, jwt);
        ListStatus status = ListStatus.from(statusParam);
        String monedaNormalized = normalizeMoneda(moneda);
        try {
            Pageable pageable = buildPageable(page, size, sortParam);
            if (from != null || to != null) {
                if (from == null || to == null) {
                    throw new IllegalArgumentException("Debe especificar las fechas 'from' y 'to' para el rango");
                }
                return service.findByRange(from, to, ctx.organizacionId(), status, pageable, monedaNormalized);
            }
            if (year != null) {
                LocalDate start = LocalDate.of(year, 1, 1);
                LocalDate end = LocalDate.of(year, 12, 31);
                return service.findByRange(start, end, ctx.organizacionId(), status, pageable, monedaNormalized);
            }
            return service.listByStatus(ctx.organizacionId(), status, pageable, monedaNormalized);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @GetMapping("/presupuestos/{id}")
    public ResponseEntity<PresupuestoDTO> getById(
        @PathVariable Long id,
        @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSubHeader,
        @AuthenticationPrincipal Jwt jwt
    ) {
        RequestContext ctx = resolveContext(usuarioSubHeader, jwt);
        try {
            return ResponseEntity.ok(service.getOneForOrganizacion(id, ctx.organizacionId()));
        } catch (ResponseStatusException ex) {
            if (ex.getStatusCode().value() == HttpStatus.NOT_FOUND.value()) {
                return ResponseEntity.notFound().build();
            }
            throw ex;
        }
    }

    @PostMapping(value = "/presupuestos", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> crear(
        @RequestBody CrearPresupuestoRequest req,
        @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSubHeader,
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @AuthenticationPrincipal Jwt jwt
    ) {
        RequestContext ctx = resolveContext(usuarioSubHeader, jwt, authorization);
        try {
            Presupuesto presupuesto = service.crearPresupuesto(req, ctx.organizacionId(), ctx.sub(), authorization);
            PresupuestoDTO dto = PresupuestoDTO.builder()
                .id(presupuesto.getId())
                .nombre(presupuesto.getNombre())
                .desde(normalizeYM(presupuesto.getDesde()))
                .hasta(normalizeYM(presupuesto.getHasta()))
                .createdAt(presupuesto.getCreatedAt() != null ? presupuesto.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                .deleted(presupuesto.isDeleted())
                .deletedAt(presupuesto.getDeletedAt() != null ? presupuesto.getDeletedAt().toString() : null)
                .deletedBy(presupuesto.getDeletedBy())
                .build();
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/presupuestos/{id}")
    public ResponseEntity<Presupuesto> update(
        @PathVariable Long id,
        @RequestBody Presupuesto payload,
        @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSubHeader,
        @AuthenticationPrincipal Jwt jwt
    ) {
        RequestContext ctx = resolveContext(usuarioSubHeader, jwt);
        try {
            Presupuesto updated = service.updateOwned(id, payload, ctx.sub(), ctx.organizacionId());
            return ResponseEntity.ok(updated);
        } catch (ResponseStatusException ex) {
            if (ex.getStatusCode().value() == HttpStatus.NOT_FOUND.value()) {
                return ResponseEntity.notFound().build();
            }
            throw ex;
        }
    }

    @DeleteMapping("/presupuestos/{id}")
    public ResponseEntity<Void> delete(
        @PathVariable Long id,
        @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSubHeader,
        @AuthenticationPrincipal Jwt jwt
    ) {
        RequestContext ctx = resolveContext(usuarioSubHeader, jwt);
        try {
            service.deleteOwned(id, ctx.sub(), ctx.organizacionId());
            return ResponseEntity.noContent().build();
        } catch (ResponseStatusException ex) {
            if (ex.getStatusCode().value() == HttpStatus.NOT_FOUND.value()) {
                return ResponseEntity.notFound().build();
            }
            throw ex;
        }
    }

    @PostMapping("/presupuestos/{id}/restore")
    public ResponseEntity<PresupuestoDTO> restore(
        @PathVariable Long id,
        @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSubHeader,
        @AuthenticationPrincipal Jwt jwt
    ) {
        RequestContext ctx = resolveContext(usuarioSubHeader, jwt);
        try {
            PresupuestoDTO restored = service.restoreOwned(id, ctx.sub(), ctx.organizacionId());
            return ResponseEntity.ok(restored);
        } catch (ResponseStatusException ex) {
            if (ex.getStatusCode().value() == HttpStatus.NOT_FOUND.value()) {
                return ResponseEntity.notFound().build();
            }
            throw ex;
        }
    }

    @GetMapping("/presupuestos/{id}/totales")
    public ResponseEntity<List<Map<String, Object>>> getTotalesPorMes(
        @PathVariable Long id,
        @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSubHeader,
        @AuthenticationPrincipal Jwt jwt
    ) {
        RequestContext ctx = resolveContext(usuarioSubHeader, jwt);
        Presupuesto presupuesto = service.mustBelong(id, ctx.organizacionId());

        List<PresupuestoLinea> lineas = presupuestoLineaRepository.findByPresupuesto_Id(presupuesto.getId());
        Map<String, List<PresupuestoLinea>> porMes = lineas.stream()
            .collect(Collectors.groupingBy(l -> normalizeYM(getMesAsString(l))));

        List<Map<String, Object>> salida = porMes.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(entry -> buildTotales(entry.getKey(), entry.getValue()))
            .collect(Collectors.toList());

        return ResponseEntity.ok(salida);
    }

    @GetMapping("/presupuestos/{id}/mes/{ym}")
    public ResponseEntity<List<Map<String, Object>>> getLineasMes(
        @PathVariable Long id,
        @PathVariable String ym,
        @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSubHeader,
        @AuthenticationPrincipal Jwt jwt
    ) {
        RequestContext ctx = resolveContext(usuarioSubHeader, jwt);
        Presupuesto presupuesto = service.mustBelong(id, ctx.organizacionId());

        String normalized = normalizeYM(ym);
        List<Map<String, Object>> out = presupuestoLineaRepository.findByPresupuesto_Id(presupuesto.getId()).stream()
            .filter(l -> Objects.equals(normalizeYM(l.getMes()), normalized))
            .map(this::toLineaDTO)
            .collect(Collectors.toList());

        return ResponseEntity.ok(out);
    }

    @PostMapping("/presupuestos/{id}/mes/{ym}/lineas")
    public ResponseEntity<Map<String, Object>> crearLinea(
        @PathVariable Long id,
        @PathVariable String ym,
        @RequestBody LineaUpsertRequest req,
        @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSubHeader,
        @AuthenticationPrincipal Jwt jwt
    ) {
        RequestContext ctx = resolveContext(usuarioSubHeader, jwt);
        Presupuesto presupuesto = service.mustOwn(id, ctx.sub(), ctx.organizacionId());

        String normalized = normalizeYM(ym);
        PresupuestoLinea linea = new PresupuestoLinea();
        linea.setPresupuesto(presupuesto);
        setMesFromString(linea, normalized);
        linea.setCategoria(req.getCategoria());
        linea.setTipo(Tipo.valueOf(req.getTipo().toUpperCase(Locale.ROOT)));
        linea.setMontoEstimado(req.getMontoEstimado() != null ? req.getMontoEstimado() : BigDecimal.ZERO);
        linea.setMontoReal(req.getMontoReal());

        PresupuestoLinea saved = presupuestoLineaRepository.save(linea);
        return ResponseEntity.ok(toLineaDTO(saved));
    }

    @PatchMapping("/presupuestos/{id}/mes/{ym}/lineas/{lineaId}")
    public ResponseEntity<Map<String, Object>> patchLinea(
        @PathVariable Long id,
        @PathVariable String ym,
        @PathVariable Long lineaId,
        @RequestBody LineaUpsertRequest req,
        @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSubHeader,
        @AuthenticationPrincipal Jwt jwt
    ) {
        RequestContext ctx = resolveContext(usuarioSubHeader, jwt);
        Presupuesto presupuesto = service.mustOwn(id, ctx.sub(), ctx.organizacionId());
        return upsertLinea(ctx, presupuesto, ym, lineaId, req, true);
    }

    @PutMapping("/presupuestos/{id}/mes/{ym}/lineas/{lineaId}")
    public ResponseEntity<Map<String, Object>> putLinea(
        @PathVariable Long id,
        @PathVariable String ym,
        @PathVariable Long lineaId,
        @RequestBody LineaUpsertRequest req,
        @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSubHeader,
        @AuthenticationPrincipal Jwt jwt
    ) {
        RequestContext ctx = resolveContext(usuarioSubHeader, jwt);
        Presupuesto presupuesto = service.mustOwn(id, ctx.sub(), ctx.organizacionId());
        return upsertLinea(ctx, presupuesto, ym, lineaId, req, false);
    }

    @DeleteMapping("/presupuestos/{id}/mes/{ym}/lineas/{lineaId}")
    public ResponseEntity<Void> deleteLinea(
        @PathVariable Long id,
        @PathVariable String ym,
        @PathVariable Long lineaId,
        @RequestHeader(value = "X-Usuario-Sub", required = false) String usuarioSubHeader,
        @AuthenticationPrincipal Jwt jwt
    ) {
        RequestContext ctx = resolveContext(usuarioSubHeader, jwt);
        service.mustOwn(id, ctx.sub(), ctx.organizacionId());

        PresupuestoLinea linea = presupuestoLineaRepository.findById(lineaId).orElse(null);
        if (linea == null) {
            return ResponseEntity.notFound().build();
        }
        if (linea.getPresupuesto() == null || !Objects.equals(linea.getPresupuesto().getId(), id)) {
            return ResponseEntity.badRequest().build();
        }
        presupuestoLineaRepository.deleteById(lineaId);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<Map<String, Object>> upsertLinea(
        RequestContext ctx,
        Presupuesto presupuesto,
        String ym,
        Long lineaId,
        LineaUpsertRequest req,
        boolean partial
    ) {
        PresupuestoLinea linea = presupuestoLineaRepository.findById(lineaId).orElse(null);
        if (linea == null) {
            return ResponseEntity.notFound().build();
        }
        if (linea.getPresupuesto() == null || !Objects.equals(linea.getPresupuesto().getId(), presupuesto.getId())) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("error", "La linea no pertenece al presupuesto indicado");
            return ResponseEntity.badRequest().body(error);
        }

        String normalized = normalizeYM(ym);
        setMesFromString(linea, normalized);

        if (!partial || req.getCategoria() != null) {
            linea.setCategoria(req.getCategoria());
        }
        if (!partial || req.getTipo() != null) {
            linea.setTipo(Tipo.valueOf(req.getTipo().toUpperCase(Locale.ROOT)));
        }
        if (!partial || req.getMontoEstimado() != null) {
            linea.setMontoEstimado(nvl(req.getMontoEstimado()));
        }
        if (!partial || (req.isExplicitMontoReal() || req.getMontoReal() != null)) {
            linea.setMontoReal(req.getMontoReal());
        }

        PresupuestoLinea saved = presupuestoLineaRepository.save(linea);

        // Notificación de presupuesto excedido si el real supera el estimado
        if (saved.getMontoEstimado() != null
                && saved.getMontoReal() != null
                && saved.getMontoReal().compareTo(saved.getMontoEstimado()) > 0) {
            presupuestoEventService.sendBudgetExceededEvent(presupuesto, saved, ctx.sub());
        }

        return ResponseEntity.ok(toLineaDTO(saved));
    }

    private Map<String, Object> buildTotales(String ym, List<PresupuestoLinea> lineas) {
        BigDecimal ingresoEstimado = BigDecimal.ZERO;
        BigDecimal ingresoReal = BigDecimal.ZERO;
        BigDecimal egresoEstimado = BigDecimal.ZERO;
        BigDecimal egresoReal = BigDecimal.ZERO;

        for (PresupuestoLinea linea : lineas) {
            BigDecimal estimado = nvl(linea.getMontoEstimado());
            BigDecimal real = nvl(linea.getMontoReal());
            if (linea.getTipo() == Tipo.INGRESO) {
                ingresoEstimado = ingresoEstimado.add(estimado);
                ingresoReal = ingresoReal.add(real);
            } else {
                egresoEstimado = egresoEstimado.add(estimado);
                egresoReal = egresoReal.add(real);
            }
        }

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("mes", ym);
        resultado.put("ingresoEstimado", ingresoEstimado);
        resultado.put("egresoEstimado", egresoEstimado);
        resultado.put("ingresoReal", ingresoReal);
        resultado.put("egresoReal", egresoReal);
        resultado.put("saldoEstimado", ingresoEstimado.subtract(egresoEstimado));
        resultado.put("saldoReal", ingresoReal.subtract(egresoReal));
        return resultado;
    }

    private static BigDecimal nvl(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static String normalizeYM(String ym) {
        if (ym == null) {
            return null;
        }
        String trimmed = ym.trim();
        if (trimmed.isEmpty()) {
            return trimmed;
        }

        var matcher = YM_PATTERN.matcher(trimmed);
        if (matcher.matches()) {
            int month = Integer.parseInt(matcher.group(2));
            if (month >= 1 && month <= 12) {
                return matcher.group(1) + "-" + String.format("%02d", month);
            }
        }

        try {
            return YearMonth.parse(trimmed).toString();
        } catch (Exception ignored) {
        }
        try {
            return LocalDate.parse(trimmed).format(YM);
        } catch (Exception ignored) {
        }
        return trimmed;
    }

    private static String getMesAsString(PresupuestoLinea linea) {
        return normalizeYM(linea.getMes());
    }

    private static void setMesFromString(PresupuestoLinea linea, String ym) {
        String normalized = normalizeYM(ym);
        try {
            YearMonth yearMonth = YearMonth.parse(normalized);
            linea.setMes(yearMonth.atDay(1).toString());
        } catch (Exception ex) {
            linea.setMes(normalized);
        }
    }

    private Map<String, Object> toLineaDTO(PresupuestoLinea linea) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", linea.getId());
        dto.put("mes", getMesAsString(linea));
        dto.put("categoria", linea.getCategoria());
        dto.put("tipo", linea.getTipo() != null ? linea.getTipo().name() : null);
        dto.put("montoEstimado", linea.getMontoEstimado());
        dto.put("montoReal", linea.getMontoReal());
        try {
            dto.put("sourceType", PresupuestoLinea.class.getMethod("getSourceType").invoke(linea));
        } catch (Exception ignored) {
        }
        try {
            dto.put("sourceId", PresupuestoLinea.class.getMethod("getSourceId").invoke(linea));
        } catch (Exception ignored) {
        }
        return dto;
    }

    private Pageable buildPageable(int page, int size, String sortParam) {
        int safePage = Math.max(page, 0);
        int safeSize = size > 0 ? size : 3;
        Sort sort = parseSort(sortParam);
        return PageRequest.of(safePage, safeSize, sort);
    }

    private Sort parseSort(String sortParam) {
        String property = "createdAt";
        Sort.Direction direction = Sort.Direction.DESC;
        if (sortParam != null && !sortParam.isBlank()) {
            String[] parts = sortParam.split(",");
            if (parts.length > 0 && !parts[0].trim().isEmpty() && isSortableProperty(parts[0].trim())) {
                property = parts[0].trim();
            }
            if (parts.length > 1) {
                direction = Sort.Direction.fromOptionalString(parts[1].trim()).orElse(Sort.Direction.DESC);
            }
        }
        Sort sort = Sort.by(new Sort.Order(direction, property));
        if (!"createdAt".equals(property)) {
            sort = sort.and(Sort.by(Sort.Order.desc("createdAt")));
        }
        return sort.and(Sort.by(Sort.Order.desc("id")));
    }

    private boolean isSortableProperty(String property) {
        return switch (property) {
            case "id", "nombre", "desde", "hasta", "createdAt" -> true;
            default -> false;
        };
    }

    private RequestContext resolveContext(String headerSub, Jwt jwt) {
        return resolveContext(headerSub, jwt, null);
    }

    private RequestContext resolveContext(String headerSub, Jwt jwt, String authorization) {
        String sub = resolveEffectiveSub(headerSub, jwt);
        Long organizacionId = resolveOrganizacionId(sub, authorization);
        return new RequestContext(sub, organizacionId);
    }

    private String resolveEffectiveSub(String headerSub, Jwt jwt) {
        if (headerSub != null && !headerSub.isBlank()) {
            return headerSub.trim();
        }
        return requireSub(jwt);
    }

    private Long resolveOrganizacionId(String sub, String authorization) {
        try {
            return administracionService.obtenerEmpresaIdPorUsuarioSub(sub, authorization);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, ex.getMessage(), ex);
        }
    }

    private String requireSub(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalido");
        }
        return jwt.getSubject();
    }

    private static final class RequestContext {
        private final String sub;
        private final Long organizacionId;

        private RequestContext(String sub, Long organizacionId) {
            this.sub = sub;
            this.organizacionId = organizacionId;
        }

        String sub() {
            return sub;
        }

        Long organizacionId() {
            return organizacionId;
        }
    }

    @lombok.Data
    public static class LineaUpsertRequest {
        private String categoria;
        private String tipo;
        private BigDecimal montoEstimado;
        private BigDecimal montoReal;
        private Boolean explicitMontoReal;

        public boolean isExplicitMontoReal() {
            return explicitMontoReal != null && explicitMontoReal;
        }
    }
}






