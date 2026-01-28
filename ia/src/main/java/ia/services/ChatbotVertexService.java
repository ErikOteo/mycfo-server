package ia.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import ia.config.VertexAiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.IOException;
import java.time.Instant;
import java.util.Base64;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotVertexService {

    private static final String CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
    private static final Pattern FENCE_PATTERN = Pattern.compile("```[a-zA-Z]*");
    private static final String KNOWLEDGE_PDF_CLASSPATH = "knowledge/base.pdf";
    private static final Pattern OUT_OF_SCOPE_PATTERN = Pattern.compile(
            "(?i)\\b(" +
                    "calcula|calcular|recalcula|recalcular|sumar|sumá|restar|multiplicar|dividir|" +
                    "porcentaje|por ciento|promedio|media|tasa|variaci[oó]n|crecimiento|" +
                    "proyecci[oó]n|proyecta|pronostica|pronostico|escenario|simulaci[oó]n|simula|" +
                    "estima|estimaci[oó]n|presupuestar|sugerir|recomienda|recomendaci[oó]n|" +
                    "monto sugerido|valor sugerido" +
            ")\\b"
    );
    private static final Pattern SCOPE_QUESTION_PATTERN = Pattern.compile(
            "(?i)\\b(que podes hacer|que puedes hacer|cual es tu alcance|cu[aá]l es tu alcance|" +
                    "para que servis|para que serv[íi]s|para qu[eé] serv[íi]s|ayuda|que haces)\\b"
    );
    private static final Pattern LOCAL_ACTION_PATTERN = Pattern.compile(
            "(?i)\\b(que puedo hacer|que pod[eé]s hacer|que puedes hacer|que se puede hacer)\\b" +
                    ".*\\b(aca|aqui|aquí|esta pantalla|este modulo|este módulo|esta seccion|esta sección|este lugar)\\b"
    );
    private static final Pattern LOCATION_QUESTION_PATTERN = Pattern.compile(
            "(?i)\\b(donde estoy|en que modulo estoy|en qué modulo estoy|que modulo es este|" +
                    "que m[oó]dulo es este|que pantalla es|que estoy viendo|que es esto que veo|donde estoy parado)\\b"
    );
    private static final Pattern EMOJI_PATTERN = Pattern.compile(
            "[\\x{1F300}-\\x{1FAFF}\\x{2600}-\\x{27BF}]"
    );
    private static final Pattern LIST_PREFIX_PATTERN = Pattern.compile("^\\s*([\\-*+•·]|\\d+\\.)\\s+");
    private static final Pattern HEADING_PREFIX_PATTERN = Pattern.compile("^\\s*#{1,6}\\s+");
    private static final Pattern QUOTE_PREFIX_PATTERN = Pattern.compile("^\\s*>\\s+");

    private final VertexAiProperties properties;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public ChatbotResult chat(String message, String module, Map<String, Object> context) {
        if (!StringUtils.hasText(message)) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "El mensaje no puede estar vacio.");
        }
        if (!StringUtils.hasText(properties.getProjectId())) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "vertex.ai.project-id no esta configurado.");
        }
        if (!StringUtils.hasText(properties.getLocation())) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "vertex.ai.location no esta configurado.");
        }

        String safeModule = StringUtils.hasText(module) ? module.trim() : "general";
        String trimmedMessage = message.trim();
        String resolvedModule = resolveModuleOverride(trimmedMessage, safeModule);

        if (isScopeQuestion(trimmedMessage) && !isLocalActionQuestion(trimmedMessage)) {
            return new ChatbotResult(ChatbotPolicy.SCOPE_RESPONSE, "");
        }

        if (isOutOfScope(trimmedMessage)) {
            return new ChatbotResult(ChatbotPolicy.OUT_OF_SCOPE_RESPONSE, "");
        }

        if (isLocationQuestion(trimmedMessage)) {
            return new ChatbotResult(buildLocationResponse(resolvedModule, context), "");
        }

        String prompt = buildPrompt(resolvedModule, trimmedMessage, context);
        String endpoint = String.format(
                "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent",
                properties.getLocation(),
                properties.getProjectId(),
                properties.getLocation(),
                properties.getModel()
        );

        String token = resolveAccessToken();
        Map<String, Object> requestBody = buildRequestBody(ChatbotPolicy.SYSTEM_PROMPT, prompt);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            String payload = objectMapper.writeValueAsString(requestBody);
            log.info("Enviando mensaje a Vertex AI. Modulo: {}, Endpoint: {}", resolvedModule, endpoint);
            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    new HttpEntity<>(payload, headers),
                    String.class
            );

            String raw = extractTextFromResponse(response.getBody());
            String cleaned = normalizePlainText(stripCodeFences(raw)).trim();
            log.info("Respuesta de Vertex AI (recortada): {}", truncate(cleaned, 1000));
            return new ChatbotResult(cleaned, raw);
        } catch (RestClientResponseException ex) {
            log.error("Vertex AI respondio con error HTTP {}: {}", ex.getRawStatusCode(), ex.getResponseBodyAsString());
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Error al consultar Vertex AI.");
        } catch (Exception ex) {
            log.error("Error consultando Vertex AI", ex);
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Error al procesar el mensaje.");
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

    private Map<String, Object> buildRequestBody(String systemPrompt, String prompt) {
        Map<String, Object> textPart = new LinkedHashMap<>();
        textPart.put("text", prompt);

        List<Map<String, Object>> parts = new java.util.ArrayList<>();
        parts.add(textPart);

        byte[] pdfBytes = loadKnowledgePdfBytes();
        if (pdfBytes != null && pdfBytes.length > 0) {
            String base64Pdf = Base64.getEncoder().encodeToString(pdfBytes);

            Map<String, Object> inlineData = new LinkedHashMap<>();
            inlineData.put("mime_type", "application/pdf");
            inlineData.put("data", base64Pdf);

            Map<String, Object> pdfPart = new LinkedHashMap<>();
            pdfPart.put("inline_data", inlineData);
            parts.add(pdfPart);
        }

        List<Map<String, Object>> parts = new java.util.ArrayList<>();
        parts.add(textPart);

        byte[] pdfBytes = loadKnowledgePdfBytes();
        if (pdfBytes != null && pdfBytes.length > 0) {
            String base64Pdf = Base64.getEncoder().encodeToString(pdfBytes);

            Map<String, Object> inlineData = new LinkedHashMap<>();
            inlineData.put("mime_type", "application/pdf");
            inlineData.put("data", base64Pdf);

            Map<String, Object> pdfPart = new LinkedHashMap<>();
            pdfPart.put("inline_data", inlineData);
            parts.add(pdfPart);
        }

        Map<String, Object> content = new LinkedHashMap<>();
        content.put("role", "user");
        content.put("parts", parts);

        Map<String, Object> systemPart = new LinkedHashMap<>();
        systemPart.put("text", systemPrompt);

        Map<String, Object> systemInstruction = new LinkedHashMap<>();
        systemInstruction.put("parts", List.of(systemPart));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", properties.getTemperature());
        generationConfig.put("maxOutputTokens", properties.getMaxOutputTokens());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(content));
        body.put("systemInstruction", systemInstruction);
        body.put("generationConfig", generationConfig);
        return body;
    }

    private byte[] loadKnowledgePdfBytes() {
        try {
            ClassPathResource resource = new ClassPathResource(KNOWLEDGE_PDF_CLASSPATH);
            if (!resource.exists()) {
                log.warn("No se encontro base de conocimiento en classpath: {}", KNOWLEDGE_PDF_CLASSPATH);
                return null;
            }
            return resource.getInputStream().readAllBytes();
        } catch (IOException ex) {
            log.error("Error leyendo PDF de base de conocimiento desde classpath: {}", KNOWLEDGE_PDF_CLASSPATH, ex);
            return null;
        }
    }

    private byte[] loadKnowledgePdfBytes() {
        try {
            ClassPathResource resource = new ClassPathResource(KNOWLEDGE_PDF_CLASSPATH);
            if (!resource.exists()) {
                log.warn("No se encontro base de conocimiento en classpath: {}", KNOWLEDGE_PDF_CLASSPATH);
                return null;
            }
            return resource.getInputStream().readAllBytes();
        } catch (IOException ex) {
            log.error("Error leyendo PDF de base de conocimiento desde classpath: {}", KNOWLEDGE_PDF_CLASSPATH, ex);
            return null;
        }
    }

    private byte[] loadKnowledgePdfBytes() {
        try {
            ClassPathResource resource = new ClassPathResource(KNOWLEDGE_PDF_CLASSPATH);
            if (!resource.exists()) {
                log.warn("No se encontro base de conocimiento en classpath: {}", KNOWLEDGE_PDF_CLASSPATH);
                return null;
            }
            return resource.getInputStream().readAllBytes();
        } catch (IOException ex) {
            log.error("Error leyendo PDF de base de conocimiento desde classpath: {}", KNOWLEDGE_PDF_CLASSPATH, ex);
            return null;
        }
    }

<<<<<<< Updated upstream
    private byte[] loadKnowledgePdfBytes() {
        try {
            ClassPathResource resource = new ClassPathResource(KNOWLEDGE_PDF_CLASSPATH);
            if (!resource.exists()) {
                log.warn("No se encontro base de conocimiento en classpath: {}", KNOWLEDGE_PDF_CLASSPATH);
                return null;
            }
            return resource.getInputStream().readAllBytes();
        } catch (IOException ex) {
            log.error("Error leyendo PDF de base de conocimiento desde classpath: {}", KNOWLEDGE_PDF_CLASSPATH, ex);
            return null;
        }
    }

=======
>>>>>>> Stashed changes
    private String extractTextFromResponse(String json) throws Exception {
        if (json == null || json.isBlank()) {
            return "";
        }
        JsonNode root = objectMapper.readTree(json);
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (textNode.isMissingNode()) {
            return "";
        }
        return textNode.asText("");
    }

    private String buildPrompt(String module, String message, Map<String, Object> context) {
        String moduleHint = switch (module.toLowerCase()) {
            case "registro" -> "Estas asistiendo en el modulo Registro: cargas, movimientos, ingresos, egresos, deudas y acreencias.";
            case "reporte" -> "Estas asistiendo en el modulo Reporte: cashflow, P&L, resumenes y analisis.";
            case "pronostico" -> "Estas asistiendo en el modulo Pronostico: presupuestos, proyecciones y escenarios.";
            case "administracion" -> "Estas asistiendo en el modulo Administracion: configuraciones y gestion general.";
            case "notificacion" -> "Estas asistiendo en el modulo Notificaciones: alertas, recordatorios y configuracion de notificaciones.";
            case "notificacion" -> "Estas asistiendo en el modulo Notificaciones: alertas, recordatorios y configuracion de notificaciones.";
            default -> "Estas asistiendo en MyCFO. Responde con foco en el modulo indicado por el usuario.";
        };

        String contextBlock = buildContextBlock(context);

        return String.join(
                "\n",
                "Contexto del sistema:",
                moduleHint,
                contextBlock,
                "",
                "Consulta del usuario:",
                message
        );
    }

    private String stripCodeFences(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String cleaned = text.trim();
        cleaned = FENCE_PATTERN.matcher(cleaned).replaceAll("");
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }

    private String normalizePlainText(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String cleaned = text;
        cleaned = cleaned.replace("*", "");
        cleaned = cleaned.replace("_", "");
        cleaned = cleaned.replace("`", "");
        cleaned = EMOJI_PATTERN.matcher(cleaned).replaceAll("");

        List<String> lines = cleaned.lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .map(line -> LIST_PREFIX_PATTERN.matcher(line).replaceAll(""))
                .map(line -> HEADING_PREFIX_PATTERN.matcher(line).replaceAll(""))
                .map(line -> QUOTE_PREFIX_PATTERN.matcher(line).replaceAll(""))
                .collect(Collectors.toList());

        return String.join("\n", lines);
    }

    private boolean isOutOfScope(String message) {
        if (message == null) {
            return false;
        }
        return OUT_OF_SCOPE_PATTERN.matcher(message).find();
    }

    private boolean isScopeQuestion(String message) {
        if (message == null) {
            return false;
        }
        return SCOPE_QUESTION_PATTERN.matcher(message).find();
    }

    private boolean isLocalActionQuestion(String message) {
        if (message == null) {
            return false;
        }
        return LOCAL_ACTION_PATTERN.matcher(message).find();
    }

    private boolean isLocationQuestion(String message) {
        if (message == null) {
            return false;
        }
        return LOCATION_QUESTION_PATTERN.matcher(message).find();
    }

    private String buildContextBlock(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return "Contexto de pantalla: no disponible.";
        }
        try {
            String json = objectMapper.writeValueAsString(context);
            return "Contexto de pantalla (datos ya calculados): " + json;
        } catch (Exception ex) {
            log.warn("No se pudo serializar el contexto de pantalla", ex);
            return "Contexto de pantalla: disponible pero no legible.";
        }
    }

    private String buildLocationResponse(String module, Map<String, Object> context) {
        String moduleLabel = friendlyModuleLabel(module);
        String screenLabel = resolveScreenLabel(context);

        if (screenLabel != null) {
            return String.join(
                    "\n",
                    "Estas en el modulo " + moduleLabel + " y la pantalla actual es " + screenLabel + ".",
                    "Si queres, decime que parte de la pantalla queres entender y te la explico."
            );
        }

        return String.join(
                "\n",
                "Estas en el modulo " + moduleLabel + ".",
                "Si me decis que pantalla o seccion estas viendo, te explico lo que aparece."
        );
    }

    private String friendlyModuleLabel(String module) {
        if (module == null) {
            return "general";
        }
        return switch (module.toLowerCase()) {
            case "registro" -> "Registro";
            case "reporte" -> "Reporte";
            case "pronostico" -> "Pronostico";
            case "administracion" -> "Administracion";
            case "notificacion" -> "Notificaciones";
            default -> "general";
        };
    }

    private String resolveScreenLabel(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return null;
        }
        Object screen = context.get("screen");
        if (screen == null) {
            return null;
        }
        String key = screen.toString().trim();
        if (key.isEmpty()) {
            return null;
        }
        return switch (key) {
            case "dashboard" -> "Dashboard";
            case "reporte-mensual" -> "Reporte mensual";
            case "flujo-de-caja" -> "Flujo de caja";
            case "estado-de-resultados" -> "Estado de resultados";
            case "movimientos-cargados" -> "Movimientos cargados";
            case "presupuestos" -> "Presupuestos";
            default -> key;
        };
    }

    private String resolveModuleOverride(String message, String currentModule) {
        if (!StringUtils.hasText(message)) {
            return currentModule;
        }
        String lower = message.toLowerCase();

        if (matchesAny(lower, "registro", "carga", "movimientos", "facturas", "conciliacion")) {
            return "registro";
        }
        if (matchesAny(lower, "reporte", "reportes", "cashflow", "flujo de caja", "estado de resultado", "estado de resultados", "p&l", "pyl", "dashboard")) {
            return "reporte";
        }
        if (matchesAny(lower, "pronostico", "pronóstico", "presupuesto", "presupuestos")) {
            return "pronostico";
        }
        if (matchesAny(lower, "administracion", "administración", "perfil", "organizacion", "organización", "roles", "invitaciones", "historial")) {
            return "administracion";
        }
        if (matchesAny(lower, "notificacion", "notificaciones", "recordatorios", "alertas")) {
            return "notificacion";
        }
        return currentModule;
    }

    private boolean matchesAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (needle != null && !needle.isBlank() && haystack.contains(needle)) {
                return true;
            }
        }
        return false;
    }

<<<<<<< Updated upstream
    private String normalizePlainText(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String cleaned = text;
        cleaned = cleaned.replace("*", "");
        cleaned = cleaned.replace("_", "");
        cleaned = cleaned.replace("`", "");
        cleaned = EMOJI_PATTERN.matcher(cleaned).replaceAll("");

        List<String> lines = cleaned.lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .map(line -> LIST_PREFIX_PATTERN.matcher(line).replaceAll(""))
                .map(line -> HEADING_PREFIX_PATTERN.matcher(line).replaceAll(""))
                .map(line -> QUOTE_PREFIX_PATTERN.matcher(line).replaceAll(""))
                .collect(Collectors.toList());

        return String.join("\n", lines);
    }

    private boolean isOutOfScope(String message) {
        if (message == null) {
            return false;
        }
        return OUT_OF_SCOPE_PATTERN.matcher(message).find();
    }

    private boolean isScopeQuestion(String message) {
        if (message == null) {
            return false;
        }
        return SCOPE_QUESTION_PATTERN.matcher(message).find();
    }

    private boolean isLocalActionQuestion(String message) {
        if (message == null) {
            return false;
        }
        return LOCAL_ACTION_PATTERN.matcher(message).find();
    }

    private boolean isLocationQuestion(String message) {
        if (message == null) {
            return false;
        }
        return LOCATION_QUESTION_PATTERN.matcher(message).find();
    }

    private String buildContextBlock(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return "Contexto de pantalla: no disponible.";
        }
        try {
            String json = objectMapper.writeValueAsString(context);
            return "Contexto de pantalla (datos ya calculados): " + json;
        } catch (Exception ex) {
            log.warn("No se pudo serializar el contexto de pantalla", ex);
            return "Contexto de pantalla: disponible pero no legible.";
        }
    }

    private String buildLocationResponse(String module, Map<String, Object> context) {
        String moduleLabel = friendlyModuleLabel(module);
        String screenLabel = resolveScreenLabel(context);

        if (screenLabel != null) {
            return String.join(
                    "\n",
                    "Estas en el modulo " + moduleLabel + " y la pantalla actual es " + screenLabel + ".",
                    "Si queres, decime que parte de la pantalla queres entender y te la explico."
            );
        }

        return String.join(
                "\n",
                "Estas en el modulo " + moduleLabel + ".",
                "Si me decis que pantalla o seccion estas viendo, te explico lo que aparece."
        );
    }

    private String friendlyModuleLabel(String module) {
        if (module == null) {
            return "general";
        }
        return switch (module.toLowerCase()) {
            case "registro" -> "Registro";
            case "reporte" -> "Reporte";
            case "pronostico" -> "Pronostico";
            case "administracion" -> "Administracion";
            case "notificacion" -> "Notificaciones";
            default -> "general";
        };
    }

    private String resolveScreenLabel(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return null;
        }
        Object screen = context.get("screen");
        if (screen == null) {
            return null;
        }
        String key = screen.toString().trim();
        if (key.isEmpty()) {
            return null;
        }
        return switch (key) {
            case "dashboard" -> "Dashboard";
            case "reporte-mensual" -> "Reporte mensual";
            case "flujo-de-caja" -> "Flujo de caja";
            case "estado-de-resultados" -> "Estado de resultados";
            case "movimientos-cargados" -> "Movimientos cargados";
            case "presupuestos" -> "Presupuestos";
            default -> key;
        };
    }

    private String resolveModuleOverride(String message, String currentModule) {
        if (!StringUtils.hasText(message)) {
            return currentModule;
        }
        String lower = message.toLowerCase();

        if (matchesAny(lower, "registro", "carga", "movimientos", "facturas", "conciliacion")) {
            return "registro";
        }
        if (matchesAny(lower, "reporte", "reportes", "cashflow", "flujo de caja", "estado de resultado", "estado de resultados", "p&l", "pyl", "dashboard")) {
            return "reporte";
        }
        if (matchesAny(lower, "pronostico", "pronóstico", "presupuesto", "presupuestos")) {
            return "pronostico";
        }
        if (matchesAny(lower, "administracion", "administración", "perfil", "organizacion", "organización", "roles", "invitaciones", "historial")) {
            return "administracion";
        }
        if (matchesAny(lower, "notificacion", "notificaciones", "recordatorios", "alertas")) {
            return "notificacion";
        }
        return currentModule;
    }

    private boolean matchesAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (needle != null && !needle.isBlank() && haystack.contains(needle)) {
                return true;
            }
        }
        return false;
=======
    private String normalizeMarkdown(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        // Eliminar asteriscos de markdown para evitar formato en el frontend
        return text.replace("*", "");
>>>>>>> Stashed changes
    }

    private String truncate(String value, int maxLen) {
        if (value == null || value.length() <= maxLen) {
            return value;
        }
        return value.substring(0, maxLen) + "...";
    }

    public record ChatbotResult(String responseText, String rawText) {
    }
}
