package ia.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import ia.config.VertexAiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.io.FileInputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class InsightsService {

    private static final String CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
    private static final String[] MESES = {
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    };
    private static final String INSIGHTS_SYSTEM_PROMPT = String.join(
            "\n",
             "Actua como analista financiero senior.",
                            "Usa lenguaje claro, cotidiano y accionable, pensado para lectores sin formación financiera.",
                            "Genera un reporte narrativo en Markdown orientado a mostrar el estado actual del negocio y facilitar decisiones.",
                            "Estructura el reporte con las siguientes secciones y respeta el rol de cada una:",
                            "## Diagnostico: resumen breve del estado financiero general. Indica si la empresa tiene dinero disponible, si está generando ganancia y si la situación es sólida o frágil. No repitas detalles que luego aparezcan en otras secciones.",
                            "## Senales: 3 a 5 puntos que aporten lecturas nuevas (oportunidades, alertas tempranas o patrones relevantes). No repitas conclusiones del Diagnostico.",
                            "## Riesgos: 2 a 4 riesgos concretos que puedan afectar el negocio si no se actúa. Sé directo y específico.",
                            "## Recomendaciones: 3 acciones claras y priorizadas (1, 2 y 3), pensadas para ejecutarse en el corto plazo.",
                            "## KPIs clave: lista o tabla corta con 3 a 5 métricas numéricas relevantes para entender el mes.",
                            "Evita términos técnicos no explicados (ej.: gap de liquidez, working capital, leverage).",
                            "Si un término financiero es necesario, explícalo en la misma frase con palabras simples.",
                            "Usa nombres de métricas descriptivos y legibles (ej.: dinero disponible, ganancia del mes, capacidad de pago).",
                            "Si falta algún dato puntual, genera el reporte igualmente usando la información disponible, siempre que sea posible obtener conclusiones razonables. Solo rechaza el reporte si la información es claramente insuficiente para un análisis confiable.",
                            "Usa solo los datos proporcionados; no inventes valores faltantes.",
                            "Al final incluye OPCIONALMENTE un bloque JSON dentro de ```json ... ``` con llaves: diagnostico_corto, senales, detalles, riesgos_clave, tips, alerta.",
                            "diagnostico_corto debe ser 3 frases cortas separadas por \\n.",
                            "Si los datos son insuficientes responde exactamente: \"No hay datos suficientes para generar un reporte confiable.\"",
                            "No incluyas explicaciones meta ni disculpas."
    );

    @Value("${mycfo.reporte.url}")
    private String reporteUrl;

    @Value("${mycfo.pronostico.url}")
    private String pronosticoUrl;

    private final VertexAiProperties vertexProperties;
    private final ObjectMapper mapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> generarInsights(String userSub, String authorization, Integer anio, Integer mes) throws Exception {
        LocalDate now = LocalDate.now();
        int year = (anio != null) ? anio : now.getYear();
        int month = (mes != null) ? mes : now.getMonthValue();
        int analysisMonth = month - 1;
        int analysisYear = year;
        if (analysisMonth < 1) {
            analysisMonth = 12;
            analysisYear = year - 1;
        }

        // Llamar microservicio reporte para obtener datos compactos
        Map<String, Object> payload = new HashMap<>();
        payload.put("anio", year);
        payload.put("mes", month);
        payload.put("anioAnalisis", analysisYear);
        payload.put("mesAnalisis", analysisMonth);

        log.info("Generando insights: userSub={}, anio={}, mes={}, anioAnalisis={}, mesAnalisis={}",
                userSub, year, month, analysisYear, analysisMonth);
        var headers = new HttpHeaders();
        headers.add("X-Usuario-Sub", userSub);
        headers.add("Authorization", authorization);

        String currency = "ARS";

        // P&L (devengado) solo ARS
        String pylUrl = reporteUrl + "/pyl?anio=" + year + "&moneda=" + currency;
        var pylResp = restTemplate.exchange(
                pylUrl, HttpMethod.GET, new HttpEntity<>(headers),
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );
        Map<String, Object> pyl = Optional.ofNullable(pylResp.getBody()).orElse(Map.of());
        log.info("P&L detalle ingresos: {}", describirDetalle(pyl.get("detalleIngresos")));
        log.info("P&L detalle egresos: {}", describirDetalle(pyl.get("detalleEgresos")));

        // Cashflow (caja) solo ARS
        String cashUrl = reporteUrl + "/cashflow?anio=" + analysisYear + "&moneda=" + currency;
        var cashResp = restTemplate.exchange(
                cashUrl, HttpMethod.GET, new HttpEntity<>(headers),
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        );
        List<Map<String, Object>> cash = Optional.ofNullable(cashResp.getBody()).orElse(List.of());

        // Resumen mensual (caja) solo ARS
        String resumenUrl = reporteUrl + "/resumen?anio=" + analysisYear + "&mes=" + analysisMonth + "&moneda=" + currency;
        var resResp = restTemplate.exchange(
                resumenUrl, HttpMethod.GET, new HttpEntity<>(headers),
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );
        Map<String, Object> resumen = Optional.ofNullable(resResp.getBody()).orElse(Map.of());

        Map<String, Object> presupuestos = fetchPresupuestos(headers);

        // Reducir datos a lo esencial para el prompt
        Map<String, Object> compact = compactarDatos(year, month, analysisYear, analysisMonth, pyl, cash, resumen);
        compact.put("presupuestos", compactarPresupuestos(presupuestos));
        payload.put("datos", compact);

        log.info("P&L devengado (GET {}/pyl?anio={}): ingresosMensuales={}, egresosMensuales={}, detalleIngresos={}, detalleEgresos={}",
                reporteUrl, year,
                pyl.getOrDefault("ingresosMensuales", List.of()),
                pyl.getOrDefault("egresosMensuales", List.of()),
                sizeOf(pyl.get("detalleIngresos")),
                sizeOf(pyl.get("detalleEgresos")));

        double[] logIngCash = (double[]) mapOrEmpty(compact.get("cashflow")).getOrDefault("ingresosMensuales", new double[0]);
        double[] logEgrCash = (double[]) mapOrEmpty(compact.get("cashflow")).getOrDefault("egresosMensuales", new double[0]);
        log.info("Cashflow (GET {}/cashflow?anio={}): ingresosMensuales={}, egresosMensuales={}",
                reporteUrl, analysisYear,
                Arrays.toString(logIngCash),
                Arrays.toString(logEgrCash));

        log.info("Resumen mensual (GET {}/resumen?anio={}&mes={}): detalleIngresos={}, detalleEgresos={}",
                reporteUrl, analysisYear, analysisMonth,
                sizeOf(resumen.get("detalleIngresos")),
                sizeOf(resumen.get("detalleEgresos")));

        Map<String, Object> presupLog = mapOrEmpty(compact.get("presupuestos"));
        Object presupTotal = presupLog.getOrDefault("total", 0);
        Object presupNombres = presupLog.getOrDefault("nombres", List.of());
        log.info("Presupuestos activos (GET {}/api/presupuestos?page=0&size=5&status=active): total={}, nombres={}",
                pronosticoUrl, presupTotal, presupNombres);

        Map<String, Object> derivadosLog = mapOrEmpty(compact.get("derivados"));
        log.info("Derivados calculados localmente: gapLiquidez={}, cajaNetaMes={}, devengadoNetoMes={}, ingresosMes={}, egresosMes={}, devengadoYtd={}, ingresosYtd={}, egresosYtd={}, mesAnalisis={}, anioAnalisis={}",
                derivadosLog.get("gapLiquidez"),
                derivadosLog.get("cajaNetaMes"),
                derivadosLog.get("devengadoNetoMes"),
                derivadosLog.get("ingresosMes"),
                derivadosLog.get("egresosMes"),
                derivadosLog.get("devengadoYtd"),
                derivadosLog.get("ingresosYtd"),
                derivadosLog.get("egresosYtd"),
                derivadosLog.get("mesAnalisis"),
                derivadosLog.get("anioAnalisis"));

        log.info("Payload listo para Vertex: userSub={}, anio={}, mes={}, anioAnalisis={}, mesAnalisis={}, keys={}",
                userSub, year, month, analysisYear, analysisMonth, compact.keySet());
        Map<String, Object> ai = llamarVertex(compact);
        payload.put("ai", ai);
        log.info("Vertex response recibida: userSub={}, keys={}", userSub, ai != null ? ai.keySet() : "null");
        return ai;
    }

    private Map<String, Object> compactarDatos(int anioPyl, int mesActual,
                                               int anioAnalisis, int mesAnalisis,
                                               Map<String, Object> pyl,
                                               List<Map<String, Object>> cash,
                                               Map<String, Object> resumen) {
        Map<String, Object> out = new HashMap<>();
        out.put("anio", anioPyl);
        out.put("mes", mesActual);
        out.put("anioAnalisis", anioAnalisis);
        out.put("mesAnalisis", mesAnalisis);
        out.put("mesActualNombre", nombreMes(mesActual));
        out.put("mesAnalisisNombre", nombreMes(mesAnalisis));

        // P&L arrays
        double[] ingPyl = toDoubleArray((List<?>) pyl.getOrDefault("ingresosMensuales", List.of()));
        double[] egrPyl = toDoubleArray((List<?>) pyl.getOrDefault("egresosMensuales", List.of()));
        out.put("pyl", Map.of(
                "ingresosMensuales", ingPyl,
                "egresosMensuales", egrPyl,
                "detalleIngresos", pyl.getOrDefault("detalleIngresos", List.of()),
                "detalleEgresos", pyl.getOrDefault("detalleEgresos", List.of())
        ));

        // Cashflow: agregamos totales por mes
        double[] ingCash = new double[12];
        double[] egrCash = new double[12];
        for (Map<String, Object> mov : cash) {
            try {
                String tipo = Objects.toString(mov.get("tipo"), "");
                String fecha = Objects.toString(
                        mov.getOrDefault("fechaEmision", mov.getOrDefault("fecha", null)),
                        null);
                if (fecha != null && fecha.length() > 10 && fecha.contains("T")) {
                    fecha = fecha.substring(0, 10);
                }
                Double monto = (mov.get("montoTotal") instanceof Number)
                        ? ((Number) mov.get("montoTotal")).doubleValue()
                        : 0.0;
                if (fecha == null) continue;
                int monthIdx = LocalDate.parse(fecha).getMonthValue() - 1;
                if ("Ingreso".equalsIgnoreCase(tipo)) ingCash[monthIdx] += monto;
                else if ("Egreso".equalsIgnoreCase(tipo)) egrCash[monthIdx] += monto;
            } catch (Exception ignore) { }
        }
        out.put("cashflow", Map.of("ingresosMensuales", ingCash, "egresosMensuales", egrCash));

        // Resumen mensual (categorías)
        out.put("resumen", Map.of(
                "detalleIngresos", resumen.getOrDefault("detalleIngresos", List.of()),
                "detalleEgresos", resumen.getOrDefault("detalleEgresos", List.of())
        ));

        // Derivados
        int idxCash = Math.max(0, Math.min(11, mesAnalisis - 1));
        int idxDevengado = (anioAnalisis == anioPyl)
                ? idxCash
                : Math.max(0, Math.min(11, mesActual - 1));
        double ingresosMes = (idxCash < ingCash.length) ? ingCash[idxCash] : 0;
        double egresosMes = (idxCash < egrCash.length) ? egrCash[idxCash] : 0;
        double cajaNeta = ingresosMes - egresosMes;
        double devengadoNeto = (idxDevengado < ingPyl.length ? ingPyl[idxDevengado] : 0)
                - (idxDevengado < egrPyl.length ? egrPyl[idxDevengado] : 0);
        double gapLiquidez = devengadoNeto - cajaNeta;

        int idxYtd = Math.max(0, Math.min(11, mesActual - 1));
        double ingresosYtd = 0;
        double egresosYtd = 0;
        for (int i = 0; i <= idxYtd && i < ingPyl.length; i++) {
            ingresosYtd += ingPyl[i];
        }
        for (int i = 0; i <= idxYtd && i < egrPyl.length; i++) {
            egresosYtd += egrPyl[i];
        }
        double devengadoYtd = ingresosYtd - egresosYtd;

        out.put("derivados", Map.of(
                "gapLiquidez", gapLiquidez,
                "cajaNetaMes", cajaNeta,
                "devengadoNetoMes", devengadoNeto,
                "ingresosMes", ingresosMes,
                "egresosMes", egresosMes,
                "devengadoYtd", devengadoYtd,
                "ingresosYtd", ingresosYtd,
                "egresosYtd", egresosYtd,
                "mesAnalisis", mesAnalisis,
                "anioAnalisis", anioAnalisis
        ));
        return out;
    }

    private int sizeOf(Object listLike) {
        if (listLike instanceof Collection<?> c) {
            return c.size();
        }
        return 0;
    }

    @SuppressWarnings("unchecked")
    private String describirDetalle(Object detalle) {
        if (!(detalle instanceof List<?> list) || list.isEmpty()) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> map)) continue;
            Object categoria = map.containsKey("categoria")
                    ? map.get("categoria")
                    : (map.containsKey("nombre") ? map.get("nombre") : "sin_categoria");
            double total = asDouble(map.get("total"));
            if (!first) sb.append("; ");
            sb.append(categoria).append(": ").append(total);
            first = false;
        }
        sb.append("]");
        return sb.toString();
    }

    private double[] toDoubleArray(List<?> list) {
        double[] out = new double[list.size()];
        for (int i = 0; i < list.size(); i++) {
            Object v = list.get(i);
            out[i] = (v instanceof Number) ? ((Number) v).doubleValue() : 0.0;
        }
        return out;
    }

    private Map<String, Object> llamarVertex(Map<String, Object> compact) throws Exception {
        if (vertexProperties == null || !org.springframework.util.StringUtils.hasText(vertexProperties.getProjectId())) {
            throw new IllegalStateException("vertex.ai.project-id no esta configurado.");
        }
        String endpoint = String.format(
                "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent",
                vertexProperties.getLocation(),
                vertexProperties.getProjectId(),
                vertexProperties.getLocation(),
                vertexProperties.getModel());

        String token = resolveAccessToken();
        String userPrompt = "Datos financieros (JSON): " + mapper.writeValueAsString(compact);

        Map<String, Object> textPart = new LinkedHashMap<>();
        textPart.put("text", userPrompt);

        Map<String, Object> content = new LinkedHashMap<>();
        content.put("role", "user");
        content.put("parts", List.of(textPart));

        Map<String, Object> systemPart = new LinkedHashMap<>();
        systemPart.put("text", INSIGHTS_SYSTEM_PROMPT);
        Map<String, Object> systemInstruction = new LinkedHashMap<>();
        systemInstruction.put("parts", List.of(systemPart));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", vertexProperties.getTemperature());
        generationConfig.put("topP", vertexProperties.getTopP());
        generationConfig.put("maxOutputTokens", vertexProperties.getMaxOutputTokens());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(content));
        body.put("systemInstruction", systemInstruction);
        body.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        String payload = mapper.writeValueAsString(body);

        try {
            ResponseEntity<String> resp = restTemplate.exchange(
                    endpoint, HttpMethod.POST, new HttpEntity<>(payload, headers), String.class);

            String rawText = extractTextFromResponse(resp.getBody());
            String contentText = normalizarContenido(rawText);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("reporte_markdown", contentText);

            String jsonBlock = extractJsonBlock(contentText);
            if (jsonBlock != null && !jsonBlock.isBlank()) {
                try {
                    Map<String, Object> parsed = mapper.readValue(
                            jsonBlock,
                            new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}
                    );
                    mergeOptionalJson(result, parsed);
                } catch (Exception ex) {
                    log.warn("No se pudo parsear el bloque JSON opcional de Vertex: {}", jsonBlock, ex);
                }
            }

            boolean hasReport = StringUtils.hasText(contentText);
            if (!hasReport) {
                throw new IllegalStateException("Vertex no devolvio contenido util.");
            }
            return result;
        } catch (RestClientResponseException ex) {
            log.error("Vertex AI respondio con error HTTP {}: {}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Error inesperado al invocar Vertex AI", ex);
            throw ex;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapOrEmpty(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value instanceof String str) {
            try {
                return Double.parseDouble(str);
            } catch (NumberFormatException ignore) { }
        }
        return 0d;
    }

    private int asInt(Object value, int defaultValue) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String str) {
            try {
                return Integer.parseInt(str);
            } catch (NumberFormatException ignore) { }
        }
        return defaultValue;
    }

    @SuppressWarnings("unchecked")
    private List<String> extraerListaTexto(Object value) {
        if (value instanceof List<?> list) {
            return list.stream()
                    .map(item -> Objects.toString(item, ""))
                    .filter(str -> !str.isBlank())
                    .toList();
        }
        return null;
    }

    private void mergeOptionalJson(Map<String, Object> target, Map<String, Object> parsed) {
        if (parsed == null || parsed.isEmpty()) {
            return;
        }
        String diag = Objects.toString(parsed.get("diagnostico_corto"), "").trim();
        if (StringUtils.hasText(diag)) {
            target.put("diagnostico_corto", diag.replace("\r", ""));
        }
        Map<String, Object> senales = mapOrEmpty(parsed.get("senales"));
        if (!senales.isEmpty()) {
            target.put("senales", senales);
        }
        Map<String, Object> detalles = mapOrEmpty(parsed.get("detalles"));
        if (!detalles.isEmpty()) {
            target.put("detalles", detalles);
        }
        List<String> riesgos = extraerListaTexto(parsed.get("riesgos_clave"));
        if (riesgos != null) {
            target.put("riesgos_clave", riesgos);
        }
        List<String> tips = extraerListaTexto(parsed.get("tips"));
        if (tips != null) {
            target.put("tips", tips);
        }
        if (parsed.containsKey("alerta")) {
            target.put("alerta", Boolean.TRUE.equals(parsed.get("alerta")));
        }
    }

    private String extractJsonBlock(String content) {
        if (!StringUtils.hasText(content)) {
            return null;
        }
        int jsonFence = content.indexOf("```json");
        if (jsonFence >= 0) {
            int start = jsonFence + "```json".length();
            int end = content.indexOf("```", start);
            if (end > start) {
                return content.substring(start, end).trim();
            }
        }
        int anyFence = content.indexOf("```");
        if (anyFence >= 0) {
            int start = anyFence + "```".length();
            int end = content.indexOf("```", start);
            if (end > start) {
                return content.substring(start, end).trim();
            }
        }
        int firstBrace = content.indexOf('{');
        int lastBrace = content.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return content.substring(firstBrace, lastBrace + 1).trim();
        }
        return null;
    }

    private String nombreMes(int mes) {
        if (mes < 1 || mes > 12) {
            return "Mes";
        }
        String nombre = MESES[mes - 1];
        return nombre.substring(0, 1).toUpperCase() + nombre.substring(1);
    }

    private Map<String, Object> compactarPresupuestos(Map<String, Object> presupuestos) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (presupuestos == null || presupuestos.isEmpty()) {
            out.put("total", 0);
            out.put("nombres", List.of());
            return out;
        }
        int total = asInt(presupuestos.get("totalElements"), 0);
        List<String> nombres = new ArrayList<>();
        Object content = presupuestos.get("content");
        if (content instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    Object nombre = map.get("nombre");
                    if (nombre != null && !nombre.toString().isBlank()) {
                        nombres.add(nombre.toString());
                    }
                }
            }
        }
        out.put("total", total);
        out.put("nombres", nombres);
        return out;
    }

    private Map<String, Object> fetchPresupuestos(HttpHeaders headers) {
        try {
            String url = pronosticoUrl + "/api/presupuestos?page=0&size=5&status=active";
            var resp = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers),
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            return Optional.ofNullable(resp.getBody()).orElse(Map.of());
        } catch (Exception ex) {
            log.warn("No se pudieron obtener presupuestos para insights: {}", ex.getMessage());
            return Map.of();
        }
    }

    private String resolveAccessToken() {
        try {
            GoogleCredentials credentials;
            if (StringUtils.hasText(vertexProperties.getCredentialsPath())) {
                try (FileInputStream stream = new FileInputStream(vertexProperties.getCredentialsPath())) {
                    credentials = GoogleCredentials.fromStream(stream);
                }
            } else {
                credentials = GoogleCredentials.getApplicationDefault();
            }
            credentials = credentials.createScoped(Collections.singleton(CLOUD_SCOPE));
            AccessToken token = credentials.getAccessToken();
            if (token == null || token.getExpirationTime() == null
                    || token.getExpirationTime().before(Date.from(Instant.now()))) {
                token = credentials.refreshAccessToken();
            }
            if (token == null) {
                throw new IllegalStateException("No se pudo obtener access token de Google.");
            }
            return token.getTokenValue();
        } catch (Exception ex) {
            log.error("Error obteniendo token de Google", ex);
            throw new IllegalStateException("No se pudo autenticar con Google.");
        }
    }

    private String extractTextFromResponse(String json) throws Exception {
        if (json == null || json.isBlank()) {
            return "";
        }
        JsonNode root = mapper.readTree(json);
        JsonNode textNode = root.path("candidates").path(0).path("content").path(0).path("text");
        if (textNode.isMissingNode()) {
            textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        }
        if (textNode.isMissingNode()) {
            return "";
        }
        return textNode.asText("");
    }

    private String normalizarContenido(String content) {
        String sanitized = content == null ? "" : content.trim();
        if (sanitized.startsWith("```")) {
            // quitar etiqueta inicial (``` o ```json)
            int firstLineBreak = sanitized.indexOf('\n');
            if (firstLineBreak > 0) {
                String firstLine = sanitized.substring(0, firstLineBreak);
                if (firstLine.startsWith("```")) {
                    sanitized = sanitized.substring(firstLineBreak + 1);
                }
            } else {
                sanitized = sanitized.replaceFirst("^```[a-zA-Z0-9]*", "");
            }
            int closing = sanitized.lastIndexOf("```");
            if (closing >= 0) {
                sanitized = sanitized.substring(0, closing);
            }
        }
        return sanitized.trim();
    }
}

