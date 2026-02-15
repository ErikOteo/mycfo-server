package registro.cargarDatos.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import registro.cargarDatos.config.VertexAiProperties;

import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.ArrayList;
import java.util.regex.Pattern;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
@RequiredArgsConstructor
@Slf4j
public class VertexAudioScannerService {

    private static final String CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
    private static final Pattern FENCE_PATTERN = Pattern.compile("```[a-zA-Z]*");

    private final VertexAiProperties properties;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public AudioScanResult scanAudio(byte[] audioBytes, String mimeType, ScanType scanType) {
        long totalStart = System.nanoTime();
        if (audioBytes == null || audioBytes.length == 0) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "No se recibio contenido de audio.");
        }
        if (!StringUtils.hasText(properties.getProjectId())) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "vertex.ai.project-id no esta configurado.");
        }
        if (!StringUtils.hasText(properties.getLocation())) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "vertex.ai.location no esta configurado.");
        }

        String prompt = buildPrompt(scanType);
        log.info("Prompt seleccionado para {}:\n{}", scanType, prompt);
        String endpoint = String.format(
                "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent",
                properties.getLocation(),
                properties.getProjectId(),
                properties.getLocation(),
                properties.getModel()
        );

        String token = resolveAccessToken();
        Map<String, Object> requestBody = buildRequestBody(prompt, audioBytes, mimeType);

        try {
            long requestStart = System.nanoTime();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            String payload = objectMapper.writeValueAsString(requestBody);
            log.info("Enviando audio a Vertex AI. Tipo: {}, Bytes: {}, Endpoint: {}", scanType, audioBytes.length, endpoint);
            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    new HttpEntity<>(payload, headers),
                    String.class
            );
            long requestEnd = System.nanoTime();

            log.info("Respuesta recibida de Vertex AI en {} ms", nanosToMillis(requestEnd - requestStart));
            String raw = extractTextFromResponse(response.getBody());
            log.info("Respuesta raw de Vertex (completa): {}", raw);
            long parseStart = System.nanoTime();
            Map<String, Object> schema = expectedSchema(scanType);
            Map<String, Object> normalized = extractAndFixJson(raw, schema);
            List<String> warnings = buildWarnings(normalized, requiredFields(scanType));
            long parseEnd = System.nanoTime();

            log.info("Parseo de respuesta completado en {} ms", nanosToMillis(parseEnd - parseStart));
            log.info("Escaneo total completado en {} ms", nanosToMillis(parseEnd - totalStart));
            return new AudioScanResult(raw, normalized, warnings);
        } catch (RestClientResponseException ex) {
            log.error("Vertex AI respondio con error HTTP {}: {}", ex.getRawStatusCode(), ex.getResponseBodyAsString());
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Error al consultar Vertex AI.");
        } catch (Exception ex) {
            log.error("Error consultando Vertex AI", ex);
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Error al procesar el audio.");
        }
    }

    private String resolveAccessToken() {
        try {
            GoogleCredentials credentials;
            if (StringUtils.hasText(properties.getCredentialsPath())) {
                try (FileInputStream stream = new FileInputStream(properties.getCredentialsPath())) {
                    credentials = GoogleCredentials.fromStream(stream);
                }
            } else {
                credentials = GoogleCredentials.getApplicationDefault();
            }
            credentials = credentials.createScoped(Collections.singleton(CLOUD_SCOPE));
            AccessToken token = credentials.getAccessToken();
            if (token == null || token.getExpirationTime() == null || token.getExpirationTime().before(Date.from(Instant.now()))) {
                token = credentials.refreshAccessToken();
            }
            if (token == null) {
                throw new IllegalStateException("No se pudo obtener access token de Google.");
            }
            return token.getTokenValue();
        } catch (Exception ex) {
            log.error("Error obteniendo token de Google", ex);
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "No se pudo autenticar con Google.");
        }
    }

    private Map<String, Object> buildRequestBody(String prompt, byte[] audioBytes, String mimeType) {
        String base64 = Base64.getEncoder().encodeToString(audioBytes);
        Map<String, Object> inlineData = new LinkedHashMap<>();
        inlineData.put("mime_type", mimeType);
        inlineData.put("data", base64);

        Map<String, Object> audioPart = new LinkedHashMap<>();
        audioPart.put("inline_data", inlineData);

        Map<String, Object> textPart = new LinkedHashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> content = new LinkedHashMap<>();
        content.put("role", "user");
        content.put("parts", List.of(textPart, audioPart));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", properties.getTemperature());
        generationConfig.put("maxOutputTokens", properties.getMaxOutputTokens());
        generationConfig.put("responseMimeType", "application/json");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(content));
        body.put("generationConfig", generationConfig);
        return body;
    }

    private String extractTextFromResponse(String json) throws Exception {
        if (json == null || json.isBlank()) {
            return "";
        }
        JsonNode root = objectMapper.readTree(json);
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray()) {
            return "";
        }
        StringBuilder combined = new StringBuilder();
        for (JsonNode candidate : candidates) {
            JsonNode parts = candidate.path("content").path("parts");
            if (!parts.isArray()) {
                continue;
            }
            for (JsonNode part : parts) {
                JsonNode textNode = part.path("text");
                if (textNode.isMissingNode()) {
                    continue;
                }
                String text = textNode.asText();
                if (text == null || text.isBlank()) {
                    continue;
                }
                if (!combined.isEmpty()) {
                    combined.append("\n");
                }
                combined.append(text);
            }
        }
        return combined.toString();
    }

    private Map<String, Object> expectedSchema(ScanType type) {
        return switch (type) {
            case FACTURA -> buildSchema(
                    "numeroDocumento", "versionDocumento", "tipoFactura", "fechaEmision", "montoTotal", "moneda",
                    "categoria", "descripcion", "vendedorNombre", "vendedorCuit", "vendedorCondicionIVA", "vendedorDomicilio",
                    "compradorNombre", "compradorCuit", "compradorCondicionIVA", "compradorDomicilio"
            );
            case INGRESO -> buildSchema(
                    "montoTotal", "moneda", "medioPago", "fechaEmision", "origenNombre", "origenCuit",
                    "categoria", "descripcion"
            );
            case EGRESO -> buildSchema(
                    "montoTotal", "moneda", "medioPago", "fechaEmision", "destinoNombre", "destinoCuit",
                    "categoria", "descripcion"
            );
            case DEUDA -> buildSchema(
                    "montoTotal", "moneda", "fechaEmision", "fechaVencimiento", "destinoNombre", "destinoCuit",
                    "cantidadCuotas", "cuotasPagadas", "montoCuota", "tasaInteres", "periodicidad",
                    "categoria", "descripcion"
            );
            case ACREENCIA -> buildSchema(
                    "montoTotal", "moneda", "fechaEmision", "fechaVencimiento", "origenNombre", "origenCuit",
                    "cantidadCuotas", "cuotasPagadas", "montoCuota", "tasaInteres", "periodicidad",
                    "categoria", "descripcion"
            );
            case MOVIMIENTO -> buildSchema(
                    "montoTotal", "moneda", "medioPago", "fechaEmision", "origen", "destino",
                    "categoria", "descripcion", "numeroDocumentoAsociado"
            );
        };
    }

    private Set<String> requiredFields(ScanType type) {
        return switch (type) {
            case FACTURA -> Set.of(
                    "numeroDocumento", "versionDocumento", "tipoFactura", "fechaEmision",
                    "montoTotal", "categoria", "vendedorNombre", "compradorNombre"
            );
            case INGRESO, EGRESO, DEUDA, ACREENCIA, MOVIMIENTO -> Set.of("montoTotal", "fechaEmision");
        };
    }

    private Map<String, Object> buildSchema(String... keys) {
        Map<String, Object> schema = new LinkedHashMap<>();
        for (String key : keys) {
            schema.put(key, null);
        }
        return schema;
    }

    private Map<String, Object> extractAndFixJson(String text, Map<String, Object> schema) {
        if (!StringUtils.hasText(text)) {
            return normalizeSchema(Collections.emptyMap(), schema);
        }

        String sanitized = FENCE_PATTERN.matcher(text).replaceAll("").replace("```", "").trim();
        int start = sanitized.indexOf('{');
        if (start < 0) {
            Map<String, Object> fallback = extractByKeys(sanitized, schema);
            if (!fallback.isEmpty()) {
                return normalizeSchema(fallback, schema);
            }
            return normalizeSchema(Collections.emptyMap(), schema);
        }
        String candidate = sanitized.substring(start);
        int end = candidate.lastIndexOf('}');
        if (end > 0) {
            candidate = candidate.substring(0, end + 1);
        }

        Map<String, Object> parsed = tryParse(candidate);
        if (parsed != null) {
            return normalizeSchema(parsed, schema);
        }

        String repaired = candidate;
        int quoteBalance = countChar(repaired, '"');
        if (quoteBalance % 2 != 0) {
            repaired = repaired + "\"";
        }
        int openBraces = countChar(repaired, '{');
        int closeBraces = countChar(repaired, '}');
        if (openBraces > closeBraces) {
            repaired = repaired + "}".repeat(openBraces - closeBraces);
        }
        repaired = repaired.replaceAll(",\\s*}", "}");

        parsed = tryParse(repaired);
        if (parsed != null) {
            return normalizeSchema(parsed, schema);
        }
        Map<String, Object> fallback = extractByKeys(repaired, schema);
        if (!fallback.isEmpty()) {
            return normalizeSchema(fallback, schema);
        }
        return normalizeSchema(Collections.emptyMap(), schema);
    }

    private Map<String, Object> extractByKeys(String text, Map<String, Object> schema) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (!StringUtils.hasText(text) || schema == null || schema.isEmpty()) {
            return result;
        }
        for (String key : schema.keySet()) {
            Pattern pattern = Pattern.compile("(?i)\"?" + Pattern.quote(key) + "\"?\\s*:\\s*(\"([^\"]*)\"|([^,}\\n]+))");
            java.util.regex.Matcher matcher = pattern.matcher(text);
            if (!matcher.find()) {
                continue;
            }
            String value = matcher.group(2) != null ? matcher.group(2) : matcher.group(3);
            if (value != null) {
                value = value.trim();
            }
            result.put(key, value);
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> tryParse(String json) {
        try {
            if (!StringUtils.hasText(json)) {
                return null;
            }
            return objectMapper.readValue(json.getBytes(StandardCharsets.UTF_8), Map.class);
        } catch (Exception ignored) {
            return null;
        }
    }

    private Map<String, Object> normalizeSchema(Map<String, Object> data, Map<String, Object> schema) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (String key : schema.keySet()) {
            Object value = data.get(key);
            Object normalized = normalizeValue(key, value);
            result.put(key, normalized);
        }
        return result;
    }

    private Object normalizeValue(String key, Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof String str) {
            String trimmed = str.trim();
            if (trimmed.isEmpty() || "null".equalsIgnoreCase(trimmed) || isPlaceholderValue(trimmed)) {
                return null;
            }
            if (isLimitedOptionField(key)) {
                return normalizeLimitedOption(key, trimmed);
            }
            if (isNumericField(key)) {
                String normalized = normalizeNumberString(trimmed);
                if (!StringUtils.hasText(normalized)) {
                    return null;
                }
                return normalized;
            }
            return trimmed;
        }
        if (isNumericField(key) && value instanceof Number number) {
            return number;
        }
        return value;
    }

    private boolean isLimitedOptionField(String key) {
        return Set.of("tipoFactura", "versionDocumento", "medioPago", "periodicidad", "moneda").contains(key);
    }

    private boolean isPlaceholderValue(String value) {
        return "monto".equalsIgnoreCase(value);
    }

    private String normalizeLimitedOption(String key, String raw) {
        String lower = raw.toLowerCase();
        return switch (key) {
            case "moneda" -> {
                if (lower.contains("usd") || lower.contains("dolar") || lower.contains("dólar") || lower.contains("u$s")) {
                    yield "USD";
                }
                if (lower.contains("ars") || lower.contains("peso")) {
                    yield "ARS";
                }
                yield null;
            }
            case "tipoFactura" -> {
                java.util.regex.Matcher matcher = Pattern.compile("(?i)\\b([ABC])\\b").matcher(raw);
                if (matcher.find()) {
                    yield matcher.group(1).toUpperCase();
                }
                yield null;
            }
            case "versionDocumento" -> {
                if (lower.contains("original")) {
                    yield "Original";
                }
                if (lower.contains("duplicado") || lower.contains("dup") || lower.contains("copia")) {
                    yield "Duplicado";
                }
                yield null;
            }
            case "medioPago" -> {
                if (lower.contains("efectivo") || containsWord(lower, "cash")) {
                    yield "Efectivo";
                }
                if (lower.contains("transferencia") || lower.contains("transf") || lower.contains("banco") || lower.contains("cbu")) {
                    yield "Transferencia";
                }
                if (lower.contains("cheque")) {
                    yield "Cheque";
                }
                if (lower.contains("tarjeta") || lower.contains("debito") || lower.contains("débito") || lower.contains("credito") || lower.contains("crédito")) {
                    yield "Tarjeta";
                }
                if (lower.contains("mercadopago") || lower.contains("mercado pago") || containsWord(lower, "mp")) {
                    yield "MercadoPago";
                }
                if (lower.contains("otro")) {
                    yield "Otro";
                }
                yield null;
            }
            case "periodicidad" -> {
                if (lower.contains("mensual")) {
                    yield "Mensual";
                }
                if (lower.contains("bimestral")) {
                    yield "Bimestral";
                }
                if (lower.contains("trimestral")) {
                    yield "Trimestral";
                }
                if (lower.contains("semestral")) {
                    yield "Semestral";
                }
                if (lower.contains("anual")) {
                    yield "Anual";
                }
                yield null;
            }
            default -> null;
        };
    }

    private boolean containsWord(String text, String word) {
        return Pattern.compile("(?i)\\b" + Pattern.quote(word) + "\\b").matcher(text).find();
    }

    private List<String> buildWarnings(Map<String, Object> campos, Set<String> required) {
        if (required == null || required.isEmpty()) {
            return List.of();
        }
        List<String> warnings = new ArrayList<>();
        for (String campo : required) {
            Object valor = campos.get(campo);
            if (valor == null || (valor instanceof String str && str.isBlank())) {
                warnings.add("No se detecto el campo \"" + campo + "\" en el audio.");
            }
        }
        return warnings;
    }

    private int countChar(String value, char c) {
        int count = 0;
        for (int i = 0; i < value.length(); i++) {
            if (value.charAt(i) == c) {
                count++;
            }
        }
        return count;
    }

    private long nanosToMillis(long nanos) {
        return Math.round(nanos / 1_000_000.0);
    }

    private boolean isNumericField(String key) {
        return Set.of("montoTotal", "montoCuota", "tasaInteres", "cantidadCuotas", "cuotasPagadas").contains(key);
    }

    private String normalizeNumberString(String value) {
        String cleaned = value.replaceAll("[^0-9,.-]", "");
        if (cleaned.contains(",") && cleaned.contains(".")) {
            cleaned = cleaned.replace(".", "").replace(",", ".");
        } else if (cleaned.contains(",")) {
            cleaned = cleaned.replace(",", ".");
        }
        return cleaned;
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        if (value.length() <= max) {
            return value;
        }
        return value.substring(0, max) + "...";
    }

    private String buildPrompt(ScanType type) {
        return switch (type) {
            case FACTURA -> """
                Sos un sistema experto en extraccion de datos fiscales de Argentina.

                Analiza el audio de una FACTURA (lectura humana o dictado) y devolve exclusivamente un JSON valido con esta estructura exacta:

                {
                "montoTotal": "",
                "moneda": "",
                "categoria": "",
                "descripcion":"",
                "versionDocumento": "",
                "compradorNombre": "",
                "vendedorNombre": "",
                "vendedorCondicionIVA": "",
                "compradorCondicionIVA": "",
                "vendedorCuit": "",
                "vendedorDomicilio": "",
                "compradorCuit": "",
                "compradorDomicilio": "",
                "numeroDocumento": "",
                "fechaEmision": "",
                }

                REGLAS GENERALES:
                - No agregar texto fuera del JSON.
                - Si un dato no esta presente, usar null.
                - Interpretar sinonimos cuando tenga sentido.
                - No inventar datos.
                
                REGLAS ESPECIFICAS:
                - versionDocumento solo puede ser Original si se menciona que compre algo, Duplicado si se menciona que vendi algo.
                - fechaEmision debe estar en formato YYYY-MM-DDTHH:mm:ss (si no hay hora, usar 00:00:00).
                - montoTotal debe ser numerico con punto decimal.
                - Si hay varios importes, usar el mayor correspondiente al total a pagar.
                """;
            case INGRESO -> """
                Sos un sistema de extraccion de datos para un movimiento de INGRESO.

                Analiza el audio y devolve exclusivamente los datos con esta estructura JSON:

                {
                  "montoTotal": "",
                  "moneda": "",
                  "medioPago": "",
                  "fechaEmision": "",
                  "origenNombre": "",
                  "origenCuit": "",
                  "categoria": "",
                  "descripcion": ""
                }

                Reglas:
                - Si un dato no esta presente, dejar null (no completar ni inventar).
                - Si algun concepto no se identifica, completar igual los demas campos que si se entiendan.
                - Interpretar sinonimos cuando tenga sentido.
                - No agregar texto fuera del JSON.
                - fechaEmision en formato YYYY-MM-DDTHH:mm:ss (si no hay hora, usar 00:00:00).
                - montoTotal debe ser numero con punto decimal.
                - medioPago debe ser uno de: Efectivo, Transferencia, Cheque, Tarjeta, MercadoPago, Otro.
                - moneda solo si se identifica explicitamente en el audio; si no, null.
                - descripcion: resumir el concepto principal; si no aparece, podés inferir una descripcion breve y creativa basada en el audio.
                """;
            case EGRESO -> """
                Sos un sistema de extraccion de datos para un movimiento de EGRESO.

                Analiza el audio y devolve exclusivamente los datos con esta estructura JSON:

                {
                  "montoTotal": "",
                  "moneda": "",
                  "medioPago": "",
                  "fechaEmision": "",
                  "destinoNombre": "",
                  "destinoCuit": "",
                  "categoria": "",
                  "descripcion": ""
                }

                Reglas:
                - Si un dato no esta presente, dejar null (no completar ni inventar).
                - Si algun concepto no se identifica, completar igual los demas campos que si se entiendan.
                - Interpretar sinonimos cuando tenga sentido.
                - No agregar texto fuera del JSON.
                - fechaEmision en formato YYYY-MM-DDTHH:mm:ss (si no hay hora, usar 00:00:00).
                - montoTotal debe ser numero con punto decimal.
                - medioPago debe ser uno de: Efectivo, Transferencia, Cheque, Tarjeta, MercadoPago, Otro.
                - moneda solo si se identifica explicitamente en el audio; si no, null.
                - descripcion: resumir el concepto principal; si no aparece, podés inferir una descripcion breve y creativa basada en el audio.
                """;
            case DEUDA -> """
                Sos un sistema de extraccion de datos para un movimiento de DEUDA.

                Analiza el audio y devolve exclusivamente los datos con esta estructura JSON:

                {
                  "montoTotal": "",
                  "moneda": "",
                  "fechaEmision": "",
                  "fechaVencimiento": "",
                  "destinoNombre": "",
                  "destinoCuit": "",
                  "cantidadCuotas": "",
                  "cuotasPagadas": "",
                  "montoCuota": "",
                  "tasaInteres": "",
                  "periodicidad": "",
                  "categoria": "",
                  "descripcion": ""
                }

                Reglas:
                - Si un dato no esta presente, dejar null (no completar ni inventar).
                - Si algun concepto no se identifica, completar igual los demas campos que si se entiendan.
                - Interpretar sinonimos cuando tenga sentido.
                - No agregar texto fuera del JSON.
                - fechaEmision en formato YYYY-MM-DDTHH:mm:ss (si no hay hora, usar 00:00:00).
                - fechaVencimiento en formato YYYY-MM-DD.
                - montoTotal y montoCuota deben ser numeros con punto decimal.
                - tasaInteres es porcentaje (ej: 45.5).
                - periodicidad debe ser: Mensual, Bimestral, Trimestral, Semestral, Anual.
                - moneda solo si se identifica explicitamente en el audio; si no, null.
                """;
            case ACREENCIA -> """
                Sos un sistema de extraccion de datos para un movimiento de ACREENCIA.

                Analiza el audio y devolve exclusivamente los datos con esta estructura JSON:

                {
                  "montoTotal": "",
                  "moneda": "",
                  "fechaEmision": "",
                  "fechaVencimiento": "",
                  "origenNombre": "",
                  "origenCuit": "",
                  "cantidadCuotas": "",
                  "cuotasPagadas": "",
                  "montoCuota": "",
                  "tasaInteres": "",
                  "periodicidad": "",
                  "categoria": "",
                  "descripcion": ""
                }

                Reglas:
                - Si un dato no esta presente, dejar null (no completar ni inventar).
                - Si algun concepto no se identifica, completar igual los demas campos que si se entiendan.
                - Interpretar sinonimos cuando tenga sentido.
                - No agregar texto fuera del JSON.
                - fechaEmision en formato YYYY-MM-DDTHH:mm:ss (si no hay hora, usar 00:00:00).
                - fechaVencimiento en formato YYYY-MM-DD.
                - montoTotal y montoCuota deben ser numeros con punto decimal.
                - tasaInteres es porcentaje (ej: 45.5).
                - periodicidad debe ser: Mensual, Bimestral, Trimestral, Semestral, Anual.
                - moneda solo si se identifica explicitamente en el audio; si no, null.
                - descripcion: resumir el concepto principal; si no aparece, podés inferir una descripcion breve y creativa basada en el audio.
                """;
            case MOVIMIENTO -> """
                Sos un sistema de extraccion de datos para un movimiento general.

                Analiza el audio y devolve exclusivamente los datos con esta estructura JSON:

                {
                  "montoTotal": "",
                  "moneda": "",
                  "medioPago": "",
                  "fechaEmision": "",
                  "origen": "",
                  "destino": "",
                  "categoria": "",
                  "descripcion": "",
                  "numeroDocumentoAsociado": ""
                }

                Reglas:
                - Si un dato no esta presente, dejar null (no completar ni inventar).
                - Si algun concepto no se identifica, completar igual los demas campos que si se entiendan.
                - Interpretar sinonimos cuando tenga sentido.
                - No agregar texto fuera del JSON.
                - fechaEmision en formato YYYY-MM-DD.
                - montoTotal debe ser numero con punto decimal.
                - medioPago debe ser uno de: Efectivo, Transferencia, Cheque, Tarjeta, MercadoPago, Otro.
                - moneda solo si se identifica explicitamente en el audio; si no, null.
                - descripcion: resumir el concepto principal; si no aparece, podés inferir una descripcion breve y creativa basada en el audio.
                """;
        };
    }

    public enum ScanType {
        FACTURA,
        MOVIMIENTO,
        INGRESO,
        EGRESO,
        DEUDA,
        ACREENCIA
    }

    public record AudioScanResult(String rawText, Map<String, Object> campos, List<String> warnings) {}
}
