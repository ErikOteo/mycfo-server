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
            "Actua como un analista financiero experto. Tu tono debe ser simple, directo y accionable.",
            "Tarea: Analiza los siguientes datos financieros de mi empresa (Ingresos, Egresos, Categorias y Presupuesto)",
            "y genera un diagnostico de la situacion actual.",
            "Por favor incluye en tu analisis:",
            "Diagnostico Corto (3 puntos clave):",
            "Liquidez: Compara mi flujo de caja (dinero real) vs. lo devengado (facturado/comprometido) del ultimo mes.",
            "Solvencia: Analiza el resultado acumulado del anio (P&L). Es la empresa solvente?",
            "Estado del Mes: Genere caja positiva o tuve deficit este mes? Menciona mis mayores ingresos y egresos por categoria.",
            "Senales: Identifica alertas financieras (ej. si estoy gastando mas de lo que ingreso o si tengo problemas de cobro).",
            "Riesgos y Recomendaciones: Dame 3 tips breves para mejorar mi situacion financiera basados en estos numeros.",
            "Responde SOLO en JSON con la forma exacta:",
            "{diagnostico_corto:string, senales:object, detalles:object, riesgos_clave:[], tips:[], alerta:boolean}.",
            "En diagnostico_corto genera 3 frases cortas, una por cada punto clave, separadas por \\n.",
            "En detalles incluye ingresoMaximo y egresoMaximo con las categorias principales.",
            "Si no hay datos suficientes, indicalo sin inventar."
    );

    @Value("${mycfo.reporte.url}")
    private String reporteUrl;

    @Value("${mycfo.pronostico.url}")
    private String pronosticoUrl;

    private final VertexAiProperties vertexProperties;
    private final ObjectMapper mapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> generarInsights(String userSub, String authorization, Integer anio, Integer mes) {
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

        try {
            log.info("Generando insights: userSub={}, anio={}, mes={}, anioAnalisis={}, mesAnalisis={}",
                    userSub, year, month, analysisYear, analysisMonth);
            var headers = new HttpHeaders();
            headers.add("X-Usuario-Sub", userSub);
            headers.add("Authorization", authorization);

            // P&L (devengado)
            String pylUrl = reporteUrl + "/pyl?anio=" + year;
            var pylResp = restTemplate.exchange(
                    pylUrl, HttpMethod.GET, new HttpEntity<>(headers),
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            Map<String, Object> pyl = Optional.ofNullable(pylResp.getBody()).orElse(Map.of());

            // Cashflow (caja)
            String cashUrl = reporteUrl + "/cashflow?anio=" + analysisYear;
            var cashResp = restTemplate.exchange(
                    cashUrl, HttpMethod.GET, new HttpEntity<>(headers),
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            List<Map<String, Object>> cash = Optional.ofNullable(cashResp.getBody()).orElse(List.of());

            // Resumen mensual (caja)
            String resumenUrl = reporteUrl + "/resumen?anio=" + analysisYear + "&mes=" + analysisMonth;
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

            log.info("Datos listos para Vertex: userSub={}, keys={}", userSub, compact.keySet());
            Map<String, Object> ai = llamarVertex(compact);
            payload.put("ai", ai);
            log.info("Vertex response recibida: userSub={}, keys={}", userSub, ai != null ? ai.keySet() : "null");
            return ai;
        } catch (Exception e) {
            log.error("Error generando insights para userSub={}, anio={}, mes={}", userSub, anio, mes, e);
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("diagnostico_corto", "No se pudo generar el análisis en este momento.");
            fallback.put("senales", Map.of());
            fallback.put("tips", List.of("Reintenta en unos minutos", "Verifica tu conexión"));
            fallback.put("error", e.getMessage());
            return fallback;
        }
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
                String fecha = Objects.toString(mov.get("fechaEmision"), null);
                Double monto = (mov.get("montoTotal") instanceof Number) ? ((Number) mov.get("montoTotal")).doubleValue() : 0.0;
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
        double cajaNeta = ingCash[idxCash] - egrCash[idxCash];
        double devengadoNeto = (idxDevengado < ingPyl.length ? ingPyl[idxDevengado] : 0)
                - (idxDevengado < egrPyl.length ? egrPyl[idxDevengado] : 0);
        double gapLiquidez = devengadoNeto - cajaNeta;
        double ingresosMes = (idxCash < ingCash.length) ? ingCash[idxCash] : 0;
        double egresosMes = (idxCash < egrCash.length) ? egrCash[idxCash] : 0;

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

    private double[] toDoubleArray(List<?> list) {
        double[] out = new double[list.size()];
        for (int i = 0; i < list.size(); i++) {
            Object v = list.get(i);
            out[i] = (v instanceof Number) ? ((Number) v).doubleValue() : 0.0;
        }
        return out;
    }

    private Map<String, Object> construirInsightBasico(Map<String, Object> compact) {
        Map<String, Object> derivados = mapOrEmpty(compact.get("derivados"));
        double gapLiquidez = asDouble(derivados.get("gapLiquidez"));
        double cajaNeta = asDouble(derivados.get("cajaNetaMes"));
        double devengadoMes = asDouble(derivados.get("devengadoNetoMes"));
        double ingresosMes = asDouble(derivados.get("ingresosMes"));
        double egresosMes = asDouble(derivados.get("egresosMes"));
        double devengadoYtd = asDouble(derivados.get("devengadoYtd"));
        double ingresosYtd = asDouble(derivados.get("ingresosYtd"));
        double egresosYtd = asDouble(derivados.get("egresosYtd"));

        int anioAnalisis = asInt(compact.get("anioAnalisis"), LocalDate.now().getYear());
        int anioPyl = asInt(compact.get("anio"), anioAnalisis);
        String mesAnalisisNombre = Objects.toString(compact.getOrDefault("mesAnalisisNombre", "Mes analizado"));
        String mesActualNombre = Objects.toString(compact.getOrDefault("mesActualNombre", "Mes actual"));

        String estadoLiquidez = gapLiquidez >= 0 ? "sana" : "tensionada";
        String estadoSolvencia = devengadoYtd >= 0 ? "solvente" : "en riesgo";
        String estadoMes = ingresosMes >= egresosMes ? "genero caja positiva" : "presento deficit de caja";

        Map<String, Object> resumen = mapOrEmpty(compact.get("resumen"));
        Map<String, Object> ingresoTop = obtenerMaxCategoria(resumen.get("detalleIngresos"));
        Map<String, Object> egresoTop = obtenerMaxCategoria(resumen.get("detalleEgresos"));

        String lineaLiquidez = String.format(
                "Liquidez (cashflow vs devengado %s %d): %s; gap = devengado (%s) - caja (%s) = %s.",
                mesAnalisisNombre, anioAnalisis, estadoLiquidez,
                formatCurrency(devengadoMes), formatCurrency(cajaNeta), formatCurrency(gapLiquidez));

        String lineaSolvencia = String.format(
                "Solvencia (P&L %d acumulado a %s): %s con resultado neto %s (ingresos %s vs egresos %s).",
                anioPyl, mesActualNombre, estadoSolvencia,
                formatCurrency(devengadoYtd), formatCurrency(ingresosYtd), formatCurrency(egresosYtd));

        String lineaIngreso = formatearCategoria(
                String.format("Ingreso mayor del mes %s %d", mesAnalisisNombre, anioAnalisis), ingresoTop);
        String lineaEgreso = formatearCategoria(
                String.format("Egreso mayor del mes %s %d", mesAnalisisNombre, anioAnalisis), egresoTop);

        String lineaEstado = String.format(
                "Estado reportes mes %s %d (cashflow/resumen): %s; ingresos %s vs egresos %s. %s / %s.",
                mesAnalisisNombre, anioAnalisis, estadoMes,
                formatCurrency(ingresosMes), formatCurrency(egresosMes),
                lineaIngreso, lineaEgreso);

        String diagnostico = String.join("\n", List.of(lineaLiquidez, lineaSolvencia, lineaEstado));

        Map<String, String> senales = new LinkedHashMap<>();
        senales.put("liquidez", lineaLiquidez);
        senales.put("rentabilidad", lineaSolvencia);

        Map<String, String> detalles = new LinkedHashMap<>();
        detalles.put("ingresoMaximo", lineaIngreso);
        detalles.put("egresoMaximo", lineaEgreso);

        Map<String, Object> resp = new HashMap<>();
        resp.put("diagnostico_corto", diagnostico);
        resp.put("senales", senales);
        resp.put("detalles", detalles);
        resp.put("riesgos_clave", List.of());
        resp.put("tips", List.of());
        resp.put("alerta", gapLiquidez < 0 || devengadoYtd < 0);
        return resp;
    }

    private Map<String, Object> adaptarRespuestaLlm(Map<String, Object> raw, Map<String, Object> compact) {
        Map<String, Object> base = construirInsightBasico(compact);
        if (raw == null || raw.isEmpty()) {
            return base;
        }

        Map<String, Object> resp = new HashMap<>(base);

        String diag = Objects.toString(raw.get("diagnostico_corto"), "").trim();
        if (!diag.isEmpty()) {
            List<String> lines = diag.replace("\r", "")
                    .lines()
                    .map(String::trim)
                    .filter(line -> !line.isEmpty())
                    .filter(line -> !line.startsWith("{") && !line.startsWith("```"))
                    .toList();
            if (!lines.isEmpty()) {
                resp.put("diagnostico_corto", String.join("\n", lines));
            }
        }

        Map<String, Object> rawSenales = mapOrEmpty(raw.get("senales"));
        if (!rawSenales.isEmpty()) {
            Map<String, String> senales = new LinkedHashMap<>();
            rawSenales.forEach((k, v) -> senales.put(k, Objects.toString(v, "")));
            resp.put("senales", senales);
        }

        Map<String, Object> rawDetalles = mapOrEmpty(raw.get("detalles"));
        if (!rawDetalles.isEmpty()) {
            Map<String, String> detalles = new LinkedHashMap<>();
            rawDetalles.forEach((k, v) -> detalles.put(k, Objects.toString(v, "")));
            resp.put("detalles", detalles);
        }

        List<String> riesgos = extraerListaTexto(raw.get("riesgos_clave"));
        if (riesgos != null) {
            resp.put("riesgos_clave", riesgos);
        }

        List<String> tips = extraerListaTexto(raw.get("tips"));
        if (tips != null) {
            resp.put("tips", tips);
        }

        if (raw.containsKey("alerta")) {
            resp.put("alerta", Boolean.TRUE.equals(raw.get("alerta")));
        }

        return resp;
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
        generationConfig.put("maxOutputTokens", vertexProperties.getMaxOutputTokens());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(content));
        body.put("systemInstruction", systemInstruction);
        body.put("generationConfig", generationConfig);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);
            String payload = mapper.writeValueAsString(body);
            ResponseEntity<String> resp = restTemplate.exchange(
                    endpoint, HttpMethod.POST, new HttpEntity<>(payload, headers), String.class);

            String rawText = extractTextFromResponse(resp.getBody());
            String contentText = normalizarContenido(rawText);
            try {
                Map<String, Object> parsed = mapper.readValue(
                        contentText,
                        new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}
                );
                return adaptarRespuestaLlm(parsed, compact);
            } catch (Exception ex) {
                log.warn("No se pudo parsear respuesta de Vertex como JSON estructurado: {}", rawText, ex);
                return construirInsightBasico(compact);
            }
        } catch (RestClientResponseException ex) {
            log.error("Vertex AI respondio con error HTTP {}: {}", ex.getRawStatusCode(), ex.getResponseBodyAsString());
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
    private Map<String, Object> obtenerMaxCategoria(Object detalle) {
        if (!(detalle instanceof List<?> lista) || lista.isEmpty()) {
            return null;
        }
        return lista.stream()
                .filter(Map.class::isInstance)
                .map(item -> (Map<String, Object>) item)
                .max(Comparator.comparingDouble(m -> asDouble(m.get("total"))))
                .orElse(null);
    }

    private String formatearCategoria(String titulo, Map<String, Object> categoria) {
        if (categoria == null) {
            return titulo + ": sin datos";
        }
        String nombre = Objects.toString(categoria.getOrDefault("categoria", "Sin categorizar"));
        double monto = asDouble(categoria.get("total"));
        return String.format("%s: %s en %s", titulo, formatCurrency(monto), nombre);
    }

    private String formatCurrency(double value) {
        String formatted = String.format(Locale.US, "%,.0f", Math.abs(value));
        return (value < 0 ? "-$" : "$") + formatted;
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

