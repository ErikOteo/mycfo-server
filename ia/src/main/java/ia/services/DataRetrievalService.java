package ia.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataRetrievalService {

    @Value("${mycfo.registro.url}")
    private String registroUrl;

    @Value("${mycfo.reporte.url}")
    private String reporteUrl;

    @Value("${mycfo.pronostico.url}")
    private String pronosticoUrl;

    @Value("${mycfo.notificacion.url}")
    private String notificacionUrl;

    @Value("${mycfo.administracion.url}")
    private String administracionUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> getBalance(String userSub, String authorization, String moneda) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(registroUrl + "/movimientos/resumen/saldo-total");
        if (StringUtils.hasText(moneda)) {
            builder.queryParam("moneda", moneda);
        }
        return exchangeForMap(builder.toUriString(), userSub, authorization);
    }

    public Map<String, Object> searchMovements(String userSub, String authorization, Map<String, Object> params) {
        int size = clampInt(getInt(params, "limite", "limit", "size"), 10, 50);
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(registroUrl + "/movimientos")
                .queryParam("page", 0)
                .queryParam("size", size)
                .queryParam("sortBy", "fechaEmision")
                .queryParam("sortDir", "desc");

        String moneda = getString(params, "moneda", "currency");
        if (StringUtils.hasText(moneda)) {
            builder.queryParam("moneda", moneda);
        }

        String tipo = getString(params, "tipo", "tipos");
        if (StringUtils.hasText(tipo)) {
            builder.queryParam("tipos", tipo);
        }

        String search = getString(params, "search", "texto");
        if (StringUtils.hasText(search)) {
            builder.queryParam("search", search);
        }

        LocalDate desde = parseDate(params, "fechaDesde", "desde");
        LocalDate hasta = parseDate(params, "fechaHasta", "hasta");

        Integer anio = getInt(params, "anio", "year");
        Integer mes = getInt(params, "mes", "month");
        if (desde == null && hasta == null && anio != null && mes != null) {
            YearMonth ym = YearMonth.of(anio, mes);
            desde = ym.atDay(1);
            hasta = ym.atEndOfMonth();
        }

        if (desde != null) {
            builder.queryParam("fechaDesde", desde);
        }
        if (hasta != null) {
            builder.queryParam("fechaHasta", hasta);
        }

        return exchangeForMap(builder.toUriString(), userSub, authorization);
    }

    public Map<String, Object> getPendingTasks(String userSub, String authorization, Map<String, Object> params) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(registroUrl + "/movimientos/resumen/conciliacion");

        LocalDate fecha = parseDate(params, "fecha", "fechaReferencia");
        Integer anio = getInt(params, "anio", "year");
        Integer mes = getInt(params, "mes", "month");
        if (fecha == null && anio != null && mes != null) {
            fecha = YearMonth.of(anio, mes).atDay(1);
        }
        if (fecha != null) {
            builder.queryParam("fecha", fecha);
        }

        return exchangeForMap(builder.toUriString(), userSub, authorization);
    }

    public Map<String, Object> getScreenData(String screen, Map<String, Object> params, String userSub,
            String authorization) {
        if (!StringUtils.hasText(screen)) {
            return Map.of("error", "missing_screen");
        }
        String normalized = normalizeScreen(screen);
        String currency = getString(params, "moneda", "currency");
        Integer year = getInt(params, "anio", "year");
        Integer month = getInt(params, "mes", "month");
        Integer page = getInt(params, "page");
        Integer size = getInt(params, "size", "limit", "limite");
        if (page == null)
            page = 0;
        if (size == null)
            size = 10;

        return switch (normalized) {
            case "dashboard" -> {
                UriComponentsBuilder builder = UriComponentsBuilder
                        .fromHttpUrl(registroUrl + "/movimientos/resumen/dashboard");
                if (year != null && month != null) {
                    builder.queryParam("fecha", year + "-" + String.format("%02d", month) + "-01");
                }
                if (currency != null)
                    builder.queryParam("moneda", currency);
                yield wrapScreen(normalized, exchangeForObject(builder.toUriString(), userSub, authorization));
            }
            case "reporte-mensual" -> {
                if (year == null || month == null) {
                    yield missingParams(normalized, year == null ? "anio" : null, month == null ? "mes" : null);
                }
                UriComponentsBuilder builder = UriComponentsBuilder
                        .fromHttpUrl(reporteUrl + "/resumen")
                        .queryParam("anio", year)
                        .queryParam("mes", month);
                if (currency != null)
                    builder.queryParam("moneda", currency);
                yield wrapScreen(normalized, exchangeForObject(builder.toUriString(), userSub, authorization));
            }
            case "flujo-de-caja" -> {
                if (year == null) {
                    yield missingParams(normalized, "anio");
                }
                UriComponentsBuilder builder = UriComponentsBuilder
                        .fromHttpUrl(reporteUrl + "/cashflow/resumen")
                        .queryParam("anio", year);
                if (currency != null)
                    builder.queryParam("moneda", currency);
                yield wrapScreen(normalized, exchangeForObject(builder.toUriString(), userSub, authorization));
            }
            case "estado-de-resultados", "estado-de-resultado" -> {
                if (year == null) {
                    yield missingParams(normalized, "anio");
                }
                UriComponentsBuilder builder = UriComponentsBuilder
                        .fromHttpUrl(reporteUrl + "/pyl")
                        .queryParam("anio", year);
                if (currency != null)
                    builder.queryParam("moneda", currency);
                yield wrapScreen(normalized, exchangeForObject(builder.toUriString(), userSub, authorization));
            }
            case "presupuestos" -> {
                UriComponentsBuilder builder = UriComponentsBuilder
                        .fromHttpUrl(pronosticoUrl + "/api/presupuestos")
                        .queryParam("page", page)
                        .queryParam("size", Math.min(Math.max(size, 1), 50))
                        .queryParam("status", "active");
                if (year != null) {
                    builder.queryParam("year", year);
                }
                if (currency != null)
                    builder.queryParam("moneda", currency);
                yield wrapScreen(normalized, exchangeForObject(builder.toUriString(), userSub, authorization));
            }
            case "pronostico-fijo" -> {
                Object forecasts = exchangeForObject(pronosticoUrl + "/api/forecasts", userSub, authorization);
                Object configs = exchangeForObject(pronosticoUrl + "/api/forecast-config", userSub, authorization);
                Map<String, Object> data = new LinkedHashMap<>();
                data.put("forecasts", forecasts);
                data.put("configs", configs);
                yield wrapScreen(normalized, data);
            }
            case "pronostico-continuo" -> {
                int horizonte = clampInt(getInt(params, "horizonteMeses", "horizonte"), 12, 24);
                UriComponentsBuilder builder = UriComponentsBuilder
                        .fromHttpUrl(pronosticoUrl + "/api/forecasts/rolling")
                        .queryParam("horizonteMeses", horizonte);
                if (currency != null)
                    builder.queryParam("moneda", currency);
                Object data = exchangeForObject(builder.toUriString(), userSub, authorization, HttpMethod.POST, null);
                yield wrapScreen(normalized, data);
            }
            case "ver-movimientos" -> wrapScreen(normalized, searchMovements(userSub, authorization, params));
            case "ver-facturas" -> {
                UriComponentsBuilder builder = UriComponentsBuilder
                        .fromHttpUrl(registroUrl + "/facturas/buscar")
                        .queryParam("page", page)
                        .queryParam("size", Math.min(Math.max(size, 1), 50))
                        .queryParam("sortBy", "fechaEmision")
                        .queryParam("sortDir", "desc");
                if (currency != null)
                    builder.queryParam("moneda", currency);
                LocalDate desde = parseDate(params, "fechaDesde", "desde");
                LocalDate hasta = parseDate(params, "fechaHasta", "hasta");
                if (desde != null)
                    builder.queryParam("fechaDesde", desde);
                if (hasta != null)
                    builder.queryParam("fechaHasta", hasta);
                yield wrapScreen(normalized, exchangeForObject(builder.toUriString(), userSub, authorization));
            }
            case "conciliacion" -> {
                String status = getString(params, "status", "estado");
                String endpoint;
                if ("conciliados".equalsIgnoreCase(status)) {
                    endpoint = "/movimientos/conciliados";
                } else if ("todos".equalsIgnoreCase(status)) {
                    endpoint = "/movimientos";
                } else {
                    endpoint = "/movimientos/sin-conciliar";
                }

                UriComponentsBuilder movs = UriComponentsBuilder
                        .fromHttpUrl(registroUrl + "/api/conciliacion" + endpoint)
                        .queryParam("page", page)
                        .queryParam("size", Math.min(Math.max(size, 1), 50))
                        .queryParam("sortBy", "fechaEmision")
                        .queryParam("sortDir", "desc");
                UriComponentsBuilder stats = UriComponentsBuilder
                        .fromHttpUrl(registroUrl + "/api/conciliacion/estadisticas");
                if (currency != null) {
                    movs.queryParam("moneda", currency);
                    stats.queryParam("moneda", currency);
                }
                Object movimientos = exchangeForObject(movs.toUriString(), userSub, authorization);
                Object estadisticas = exchangeForObject(stats.toUriString(), userSub, authorization);
                Map<String, Object> data = new LinkedHashMap<>();
                data.put("movimientos", movimientos);
                data.put("estadisticas", estadisticas);
                data.put("status", status != null ? status : "sin-conciliar");
                yield wrapScreen(normalized, data);
            }
            case "carga-movimientos" -> wrapScreen(normalized,
                    exchangeForObject(registroUrl + "/api/historial-cargas", userSub, authorization));
            case "mercado-pago" -> wrapScreen(normalized,
                    exchangeForObject(registroUrl + "/api/mp/status", userSub, authorization));
            case "carga", "carga-datos", "presupuestos/nuevo" -> {
                UriComponentsBuilder builder = UriComponentsBuilder
                        .fromHttpUrl(registroUrl + "/api/categorias");
                String tipo = getString(params, "tipo");
                if (StringUtils.hasText(tipo)) {
                    builder.queryParam("tipo", tipo);
                }
                yield wrapScreen(normalized, exchangeForObject(builder.toUriString(), userSub, authorization));
            }
            case "recordatorios" -> {
                Integer userId = getInt(params, "userId", "usuarioId");
                if (userId == null) {
                    yield missingParams(normalized, "userId");
                }
                yield wrapScreen(normalized,
                        exchangeForObject(notificacionUrl + "/api/users/" + userId + "/reminders", userSub,
                                authorization));
            }
            case "listado-notificaciones" -> {
                Integer userId = getInt(params, "userId", "usuarioId");
                if (userId == null) {
                    yield missingParams(normalized, "userId");
                }
                yield wrapScreen(normalized,
                        exchangeForObject(notificacionUrl + "/api/users/" + userId + "/notifications", userSub,
                                authorization));
            }
            case "configuracion-notificaciones" -> {
                Integer userId = getInt(params, "userId", "usuarioId");
                if (userId == null) {
                    yield missingParams(normalized, "userId");
                }
                yield wrapScreen(normalized,
                        exchangeForObject(notificacionUrl + "/api/users/" + userId + "/notification-preferences",
                                userSub, authorization));
            }
            case "perfil" -> wrapScreen(normalized,
                    exchangeForObject(administracionUrl + "/api/usuarios/perfil", userSub, authorization));
            case "organizacion" -> wrapScreen(normalized,
                    exchangeForObject(administracionUrl + "/api/organizacion/info-completa", userSub, authorization));
            default -> Map.of("error", "unsupported_screen", "screen", normalized);
        };
    }

    private Map<String, Object> exchangeForMap(String url, String userSub, String authorization) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Usuario-Sub", userSub);
            if (StringUtils.hasText(authorization)) {
                headers.set("Authorization", authorization);
            }
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });
            Map<String, Object> body = response.getBody();
            return body != null ? body : Map.of();
        } catch (RestClientResponseException ex) {
            log.error("Data retrieval HTTP {} al consultar {}", ex.getRawStatusCode(), url);
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("error", "http_" + ex.getRawStatusCode());
            return error;
        } catch (Exception ex) {
            log.error("Data retrieval error al consultar {}", url, ex);
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("error", "unexpected_error");
            return error;
        }
    }

    private Object exchangeForObject(String url, String userSub, String authorization) {
        return exchangeForObject(url, userSub, authorization, HttpMethod.GET, null);
    }

    private Object exchangeForObject(String url, String userSub, String authorization, HttpMethod method, Object body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Usuario-Sub", userSub);
            if (StringUtils.hasText(authorization)) {
                headers.set("Authorization", authorization);
            }
            HttpEntity<Object> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Object> response = restTemplate.exchange(url, method, entity, Object.class);
            return response.getBody() != null ? response.getBody() : Map.of();
        } catch (RestClientResponseException ex) {
            log.error("Data retrieval HTTP {} al consultar {}", ex.getRawStatusCode(), url);
            return Map.of("error", "http_" + ex.getRawStatusCode());
        } catch (Exception ex) {
            log.error("Data retrieval error al consultar {}", url, ex);
            return Map.of("error", "unexpected_error");
        }
    }

    private Map<String, Object> wrapScreen(String screen, Object data) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("screen", screen);
        out.put("data", data);
        return out;
    }

    private Map<String, Object> missingParams(String screen, String... keys) {
        java.util.List<String> missing = new java.util.ArrayList<>();
        if (keys != null) {
            for (String key : keys) {
                if (StringUtils.hasText(key)) {
                    missing.add(key);
                }
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("error", "missing_params");
        out.put("screen", screen);
        out.put("missing", missing);
        return out;
    }

    private String normalizeScreen(String screen) {
        String cleaned = screen == null ? "" : screen.trim().toLowerCase();
        cleaned = cleaned.replace("#/", "/");
        while (cleaned.startsWith("/")) {
            cleaned = cleaned.substring(1);
        }
        while (cleaned.endsWith("/")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }
        return cleaned.isEmpty() ? screen : cleaned;
    }

    private String getString(Map<String, Object> params, String... keys) {
        if (params == null) {
            return null;
        }
        for (String key : keys) {
            Object value = params.get(key);
            if (value != null) {
                String text = value.toString().trim();
                if (!text.isEmpty()) {
                    return text;
                }
            }
        }
        return null;
    }

    private Integer getInt(Map<String, Object> params, String... keys) {
        if (params == null) {
            return null;
        }
        for (String key : keys) {
            Object value = params.get(key);
            if (value instanceof Number number) {
                return number.intValue();
            }
            if (value instanceof String text) {
                try {
                    return Integer.parseInt(text.trim());
                } catch (NumberFormatException ignore) {
                    // ignore
                }
            }
        }
        return null;
    }

    private LocalDate parseDate(Map<String, Object> params, String... keys) {
        if (params == null) {
            return null;
        }
        for (String key : keys) {
            Object value = params.get(key);
            if (value instanceof LocalDate date) {
                return date;
            }
            if (value instanceof String text) {
                try {
                    return LocalDate.parse(text.trim());
                } catch (Exception ignore) {
                    // ignore
                }
            }
        }
        return null;
    }

    private int clampInt(Integer value, int defaultValue, int max) {
        if (value == null) {
            return defaultValue;
        }
        return Math.min(Math.max(value, 1), max);
    }
}
