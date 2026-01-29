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
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.io.FileInputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
            "(?i)\b(" +
                    "calcula|calcular|recalcula|recalcular|sumar|suma|restar|resta|" +
                    "multiplicar|multiplica|dividir|divide|porcentaje|promedio|tasa|" +
                    "variacion|crecimiento|proyeccion|proyecta|pronostica|pronostico|" +
                    "escenario|simulacion|simula|estima|estimacion|presupuestar" +
                    ")\b");
    private static final Pattern SCOPE_QUESTION_PATTERN = Pattern.compile(
            "(?i)\\b(que podes hacer|que puedes hacer|cual es tu alcance|cu[aá]l es tu alcance|" +
                    "para que servis|para que serv[íi]s|para qu[eé] serv[íi]s|ayuda|que haces)\\b");
    private static final Pattern LOCAL_ACTION_PATTERN = Pattern.compile(
            "(?i)\\b(que puedo hacer|que pod[eé]s hacer|que puedes hacer|que se puede hacer)\\b" +
                    ".*\\b(aca|aqui|aquí|esta pantalla|este modulo|este módulo|esta seccion|esta sección|este lugar)\\b");
    private static final Pattern LOCATION_QUESTION_PATTERN = Pattern.compile(
            "(?i)\\b(donde estoy|en que modulo estoy|en qué modulo estoy|que modulo es este|" +
                    "que m[oó]dulo es este|que pantalla es|que estoy viendo|que es esto que veo|donde estoy parado)\\b");
    private static final Pattern GREETING_ONLY_PATTERN = Pattern.compile(
            "(?i)^\\s*(hola|buenas|buenos dias|buen d[ií]a|buen dia|buenas tardes|buenas noches|hello|hey)\\s*[!.?]*\\s*$");
    private static final Pattern INTERPRETATION_PATTERN = Pattern.compile(
            "(?i)\\b(interpretaci[oó]n|interpretar|que significa|significa|lectura|analisis|análisis|explicaci[oó]n|explica|" +
                    "que puedes decirme|que me puedes decir|que puedes decir|que me puedes contar|que ves en pantalla|sobre los datos|sobre estos datos)\\b");
    private static final Pattern IDENTITY_QUESTION_PATTERN = Pattern.compile(
            "(?i)\\b(qui[eé]n soy|mi nombre|nombre de usuario|mi usuario|usuario estoy usando|" +
                    "mi cuenta|mi perfil|mi email|mi correo|mi mail|mi tel[ée]fono|mi telefono|mi celular)\\b");
    private static final Pattern EMAIL_QUESTION_PATTERN = Pattern.compile("(?i)\\b(email|e-mail|correo|mail)\\b");
    private static final Pattern PHONE_QUESTION_PATTERN = Pattern.compile("(?i)\\b(tel[ée]fono|telefono|celular|celu|m[oó]vil|movil)\\b");
    private static final Pattern NAME_QUESTION_PATTERN = Pattern.compile("(?i)\\b(nombre|usuario)\\b");
    private static final Pattern DATE_QUESTION_PATTERN = Pattern.compile(
            "(?i)\\b(qu[eé] fecha es|qu[eé] d[ií]a es|qu[eé] d[ií]a|fecha|d[ií]a|hoy|ahora|" +
                    "en qu[eé] d[ií]a estamos|en qu[eé] fecha estamos|qu[eé] hora es|hora)\\b");
    private static final Pattern TIME_QUESTION_PATTERN = Pattern.compile("(?i)\\bhora\\b");
    private static final Pattern DATA_REQUEST_PATTERN = Pattern.compile(
            "(?i)\\b(cuanto|cuantos|monto|importe|total|saldo|balance|resultado|ingresos|egresos|" +
                    "cash ?flow|flujo de caja|p&l|pyl|presupuesto|presupuestos|factura|facturas|" +
                    "cobro|cobros|pago|pagos|movimiento|movimientos|reporte|reportes|estado de resultados|" +
                    "deuda|deudas|acreencia|acreencias|kpi|indicador|indicadores|numero|numeros)\\b");
    private static final Pattern HOW_TO_PATTERN = Pattern.compile(
            "(?i)\\b(c[oó]mo|d[oó]nde|pasos|procedimiento|instrucciones|gu[ií]a|tutorial|ayuda|" +
                    "c[oó]mo hago|c[oó]mo puedo|dime c[oó]mo|dime d[oó]nde|qu[eé] hace|para qu[eé] sirve|" +
                    "d[oó]nde encuentro|d[oó]nde esta|d[oó]nde está|configurar|activar|desactivar|crear|" +
                    "editar|cargar|importar|conciliar|generar)\\b");
    private static final Pattern BUDGET_PATTERN = Pattern.compile("(?i)\\bpresupuesto(s)?\\b");
    private static final Pattern EMOJI_PATTERN = Pattern.compile(
            "[\\x{1F300}-\\x{1FAFF}\\x{2600}-\\x{27BF}]");
    private static final Pattern LIST_PREFIX_PATTERN = Pattern.compile("^\\s*([\\-*+•·]|\\d+\\.)\\s+");
    private static final Pattern HEADING_PREFIX_PATTERN = Pattern.compile("^\\s*#{1,6}\\s+");
    private static final Pattern QUOTE_PREFIX_PATTERN = Pattern.compile("^\\s*>\\s+");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");
    private static final Set<String> CONTEXT_IGNORE_KEYS = Set.of(
            "screen",
            "module",
            "period",
            "currency",
            "filters",
            "query",
            "pageIndex",
            "statusFilter"
    );

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
        String promptMessage = trimmedMessage;
        boolean forceManual = false;

        if (isGreeting(trimmedMessage)) {
            return new ChatbotResult(ChatbotPolicy.GREETING_RESPONSE, "");
        }

        if (isScopeQuestion(trimmedMessage) && !isLocalActionQuestion(trimmedMessage)) {
            return new ChatbotResult(ChatbotPolicy.SCOPE_RESPONSE, "");
        }

        if (isIdentityQuestion(trimmedMessage)) {
            return new ChatbotResult(buildProfileResponse(trimmedMessage, context), "");
        }

        if (isDateQuestion(trimmedMessage)) {
            return new ChatbotResult(buildDateResponse(trimmedMessage), "");
        }

        if (isLocationQuestion(trimmedMessage)) {
            String locationPrompt = buildLocationSummaryPrompt(resolvedModule, context);
            if (!StringUtils.hasText(locationPrompt)) {
                return new ChatbotResult(buildLocationResponse(resolvedModule, context), "");
            }
            promptMessage = locationPrompt;
            forceManual = true;
        }

        if (isOutOfScope(trimmedMessage)) {
            return new ChatbotResult(ChatbotPolicy.OUT_OF_SCOPE_RESPONSE, "");
        }

        if (isBudgetQuestion(trimmedMessage) && !isHowToQuestion(trimmedMessage) && !hasBudgetData(context)) {
            return new ChatbotResult(ChatbotPolicy.NO_BUDGETS_RESPONSE, "");
        }

        if (isDataRequest(trimmedMessage) && !isHowToQuestion(trimmedMessage) && !hasUsableData(context)) {
            return new ChatbotResult(ChatbotPolicy.NO_DATA_RESPONSE, "");
        }

        if (isInterpretationRequest(trimmedMessage)) {
            promptMessage = buildInterpretationPrompt(promptMessage, context);
        }
        String prompt = buildPrompt(resolvedModule, promptMessage, context);
        String endpoint = String.format(
                "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent",
                properties.getLocation(),
                properties.getProjectId(),
                properties.getLocation(),
                properties.getModel());

        String token = resolveAccessToken();
        boolean includeManual = forceManual || shouldAttachManual(promptMessage);
        Map<String, Object> requestBody = buildRequestBody(ChatbotPolicy.SYSTEM_PROMPT, prompt, includeManual);

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
                    String.class);

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
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "No se pudo autenticar con Google.");
        }
    }

    private Map<String, Object> buildRequestBody(String systemPrompt, String prompt, boolean includePdf) {
        Map<String, Object> textPart = new LinkedHashMap<>();
        textPart.put("text", prompt);

        List<Map<String, Object>> parts = new java.util.ArrayList<>();
        parts.add(textPart);

        if (includePdf) {
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
            case "registro" ->
                "Estas asistiendo en el modulo Registro: cargas, movimientos, ingresos, egresos, deudas y acreencias.";
            case "reporte" -> "Estas asistiendo en el modulo Reporte: cashflow, P&L, resumenes y analisis.";
            case "pronostico" -> "Estas asistiendo en el modulo Pronostico: presupuestos, proyecciones y escenarios.";
            case "administracion" -> "Estas asistiendo en el modulo Administracion: configuraciones y gestion general.";
            case "notificacion" ->
                "Estas asistiendo en el modulo Notificaciones: alertas, recordatorios y configuracion de notificaciones.";
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
                message);
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

    private boolean isGreeting(String message) {
        if (message == null) {
            return false;
        }
        return GREETING_ONLY_PATTERN.matcher(message.trim()).matches();
    }

    private boolean isInterpretationRequest(String message) {
        if (message == null) {
            return false;
        }
        return INTERPRETATION_PATTERN.matcher(message).find();
    }

    private boolean isIdentityQuestion(String message) {
        if (message == null) {
            return false;
        }
        return IDENTITY_QUESTION_PATTERN.matcher(message).find();
    }

    private boolean isEmailQuestion(String message) {
        if (message == null) {
            return false;
        }
        return EMAIL_QUESTION_PATTERN.matcher(message).find();
    }

    private boolean isPhoneQuestion(String message) {
        if (message == null) {
            return false;
        }
        return PHONE_QUESTION_PATTERN.matcher(message).find();
    }

    private boolean isNameQuestion(String message) {
        if (message == null) {
            return false;
        }
        return NAME_QUESTION_PATTERN.matcher(message).find();
    }

    private boolean isDateQuestion(String message) {
        if (message == null) {
            return false;
        }
        return DATE_QUESTION_PATTERN.matcher(message).find();
    }

    private boolean isDataRequest(String message) {
        if (message == null) {
            return false;
        }
        return DATA_REQUEST_PATTERN.matcher(message).find();
    }

    private boolean isHowToQuestion(String message) {
        if (message == null) {
            return false;
        }
        return HOW_TO_PATTERN.matcher(message).find();
    }

    private boolean isBudgetQuestion(String message) {
        if (message == null) {
            return false;
        }
        return BUDGET_PATTERN.matcher(message).find();
    }

    private boolean shouldAttachManual(String message) {
        if (!StringUtils.hasText(message)) {
            return true;
        }
        if (isIdentityQuestion(message) || isDateQuestion(message)) {
            return false;
        }
        if (isDataRequest(message) && !isHowToQuestion(message)) {
            return false;
        }
        return true;
    }

    private boolean hasUsableData(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return false;
        }
        for (Map.Entry<String, Object> entry : context.entrySet()) {
            String key = entry.getKey();
            if (key != null && CONTEXT_IGNORE_KEYS.contains(key)) {
                continue;
            }
            Object value = entry.getValue();
            if (value == null) {
                continue;
            }
            if (value instanceof String && ((String) value).isBlank()) {
                continue;
            }
            if (value instanceof Map && ((Map<?, ?>) value).isEmpty()) {
                continue;
            }
            if (value instanceof java.util.Collection && ((java.util.Collection<?>) value).isEmpty()) {
                continue;
            }
            return true;
        }
        return false;
    }

    private boolean hasBudgetData(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return false;
        }
        Object totalPresupuestos = context.get("totalPresupuestos");
        if (totalPresupuestos instanceof Number && ((Number) totalPresupuestos).longValue() > 0) {
            return true;
        }
        if (totalPresupuestos instanceof String) {
            try {
                if (Long.parseLong(((String) totalPresupuestos).trim()) > 0) {
                    return true;
                }
            } catch (NumberFormatException ignored) {
            }
        }
        Object muestra = context.get("muestra");
        if (muestra instanceof java.util.Collection && !((java.util.Collection<?>) muestra).isEmpty()) {
            return true;
        }
        Object budget = context.get("budget");
        if (budget instanceof Map && !((Map<?, ?>) budget).isEmpty()) {
            return true;
        }
        return budget != null && !(budget instanceof Map) && !(budget instanceof java.util.Collection);
    }

    private String buildProfileResponse(String message, Map<String, Object> context) {
        if (isPhoneQuestion(message)) {
            String phone = extractProfileValue(context, "telefono", "teléfono", "phone", "celular", "mobile");
            if (!StringUtils.hasText(phone)) {
                return ChatbotPolicy.NO_PROFILE_RESPONSE;
            }
            return "Tu telefono es " + phone.trim() + ".";
        }
        if (isEmailQuestion(message)) {
            String email = extractProfileValue(context, "email", "correo", "mail");
            if (!StringUtils.hasText(email)) {
                return ChatbotPolicy.NO_PROFILE_RESPONSE;
            }
            return "Tu email es " + email.trim() + ".";
        }
        if (isNameQuestion(message)) {
            String name = extractProfileValue(context, "nombre", "name", "usuario", "username");
            if (!StringUtils.hasText(name)) {
                return ChatbotPolicy.NO_PROFILE_RESPONSE;
            }
            return "Tu nombre es " + name.trim() + ".";
        }
        String identity = extractIdentityValue(context);
        if (!StringUtils.hasText(identity)) {
            return ChatbotPolicy.NO_PROFILE_RESPONSE;
        }
        return "Estas autenticado como " + identity.trim() + ".";
    }

    private String buildDateResponse(String message) {
        LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
        if (message != null && TIME_QUESTION_PATTERN.matcher(message).find()) {
            return "La hora actual es " + TIME_FORMAT.format(now) + ".";
        }
        LocalDate date = now.toLocalDate();
        return "La fecha de hoy es " + DATE_FORMAT.format(date) + ".";
    }

    private String extractIdentityValue(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return null;
        }
        String direct = pickFirstNonBlank(context,
                "nombre", "name", "usuario", "username", "email", "correo", "mail");
        if (StringUtils.hasText(direct)) {
            return direct;
        }
        Object nestedUser = context.get("user");
        if (nestedUser instanceof Map) {
            String nested = pickFirstNonBlank((Map<?, ?>) nestedUser,
                    "nombre", "name", "usuario", "username", "email", "correo", "mail");
            if (StringUtils.hasText(nested)) {
                return nested;
            }
        }
        Object nestedProfile = context.get("perfil");
        if (nestedProfile instanceof Map) {
            String nested = pickFirstNonBlank((Map<?, ?>) nestedProfile,
                    "nombre", "name", "usuario", "username", "email", "correo", "mail");
            if (StringUtils.hasText(nested)) {
                return nested;
            }
        }
        return null;
    }

    private String extractProfileValue(Map<String, Object> context, String... keys) {
        if (context == null || context.isEmpty()) {
            return null;
        }
        String direct = pickFirstNonBlank(context, keys);
        if (StringUtils.hasText(direct)) {
            return direct;
        }
        Object nestedUser = context.get("user");
        if (nestedUser instanceof Map) {
            String nested = pickFirstNonBlank((Map<?, ?>) nestedUser, keys);
            if (StringUtils.hasText(nested)) {
                return nested;
            }
        }
        Object nestedProfile = context.get("perfil");
        if (nestedProfile instanceof Map) {
            String nested = pickFirstNonBlank((Map<?, ?>) nestedProfile, keys);
            if (StringUtils.hasText(nested)) {
                return nested;
            }
        }
        return null;
    }

    private String pickFirstNonBlank(Map<?, ?> map, String... keys) {
        if (map == null || map.isEmpty() || keys == null) {
            return null;
        }
        for (String key : keys) {
            if (key == null) {
                continue;
            }
            Object value = map.get(key);
            if (value == null) {
                continue;
            }
            String asString = value.toString().trim();
            if (!asString.isEmpty()) {
                return asString;
            }
        }
        return null;
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
            if ("Dashboard".equalsIgnoreCase(screenLabel)) {
                return String.join(
                        "\n",
                        "Estas en el Dashboard.",
                        "Si queres, decime que parte de la pantalla queres entender y te la explico.");
            }
            return String.join(
                    "\n",
                    "Estas en el modulo " + moduleLabel + " y la pantalla actual es " + screenLabel + ".",
                    "Si queres, decime que parte de la pantalla queres entender y te la explico.");
        }

        return String.join(
                "\n",
                "Estas en el modulo " + moduleLabel + ".",
                "Si me decis que pantalla o seccion estas viendo, te explico lo que aparece.");
    }

    private String buildLocationSummaryPrompt(String module, Map<String, Object> context) {
        String screenLabel = resolveScreenLabel(context);
        if (!StringUtils.hasText(screenLabel)) {
            return null;
        }
        String moduleLabel = friendlyModuleLabel(module);
        String route = extractRoute(context);
        String locationLine;
        if ("Dashboard".equalsIgnoreCase(screenLabel)) {
            locationLine = "Pantalla actual: Dashboard.";
        } else {
            locationLine = "Modulo actual: " + moduleLabel + ". Pantalla actual: " + screenLabel + ".";
        }

        String routeLine = StringUtils.hasText(route) ? "Ruta actual: " + route + "." : "";

        return String.join(
                "\n",
                "El usuario pregunta donde esta dentro de MyCFO.",
                locationLine,
                routeLine,
                "Usa el manual para la pantalla indicada y responde en texto plano con 2 o 3 parrafos cortos.",
                "Primero indica la ubicacion. Si la pantalla es Dashboard, responde solo 'Estas en el Dashboard' sin mencionar otro modulo.",
                "Luego resume que se ve en esa pantalla y que puede hacer el usuario ahi.",
                "No uses listas ni ejemplos con datos."
        );
    }

    private String buildInterpretationPrompt(String message, Map<String, Object> context) {
        String screenLabel = resolveScreenLabel(context);
        String screenLine = StringUtils.hasText(screenLabel)
                ? "Pantalla actual: " + screenLabel + "."
                : "";
        return String.join(
                "\n",
                "El usuario pide una interpretacion financiera basica.",
                screenLine,
                "No repitas cifras exactas ni describas lo obvio en pantalla.",
                "Explica el significado en lenguaje simple y si hay patrones claros en datos ya calculados, mencionarlos.",
                "Si faltan datos para interpretar, deci que no hay suficiente informacion.",
                "Maximo 2 parrafos cortos, sin listas.",
                "Si podria haber mas detalle, cerra con una pregunta corta para confirmar si desea continuar.",
                "Pregunta original: " + message
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
        String routeLabel = resolveScreenLabelFromRoute(context);
        if (StringUtils.hasText(routeLabel)) {
            return routeLabel;
        }
        Object screen = context.get("screen");
        if (screen == null) {
            return null;
        }
        String key = screen.toString().trim();
        if (key.isEmpty()) {
            return null;
        }
        return resolveScreenLabelFromKey(key);
    }

    private String resolveScreenLabelFromKey(String key) {
        if (!StringUtils.hasText(key)) {
            return null;
        }
        String normalized = key.trim().toLowerCase();
        if (isMonthSegment(normalized)) {
            return "Detalle mensual de presupuesto";
        }
        return switch (normalized) {
            case "dashboard" -> "Dashboard";
            case "reporte-mensual" -> "Reporte mensual";
            case "flujo-de-caja" -> "Flujo de caja";
            case "estado-de-resultados", "estado-de-resultado" -> "Estado de resultados";
            case "movimientos-cargados" -> "Movimientos cargados";
            case "presupuestos" -> "Presupuestos";
            case "conciliacion" -> "Conciliacion";
            case "carga" -> "Carga";
            case "carga-movimientos" -> "Carga de movimientos";
            case "ver-movimientos" -> "Movimientos";
            case "ver-facturas" -> "Facturas";
            case "mercado-pago" -> "Mercado Pago";
            case "pronostico-continuo" -> "Pronostico continuo";
            case "pronostico-fijo" -> "Pronostico fijo";
            case "recordatorios" -> "Recordatorios";
            case "listado-notificaciones" -> "Centro de notificaciones";
            case "configuracion-notificaciones" -> "Configuracion de notificaciones";
            case "configuracion-email" -> "Configuracion email";
            case "perfil" -> "Perfil";
            case "organizacion" -> "Organizacion";
            case "historial-cambios" -> "Historial de cambios";
            case "roles" -> "Roles";
            case "invitaciones" -> "Invitaciones";
            case "reportes" -> "Reportes";
            case "ventas" -> "Reporte de ventas";
            case "nuevo" -> "Nuevo presupuesto";
            case "nueva" -> "Nueva configuracion";
            case "detalle" -> "Detalle";
            case "configuracion" -> "Configuracion";
            case "formulario" -> "Carga por formulario";
            case "documento" -> "Carga por documento";
            case "foto" -> "Carga por foto";
            case "audio" -> "Carga por audio";
            case "ingreso" -> "Carga de ingreso";
            case "egreso" -> "Carga de egreso";
            case "deuda" -> "Carga de deuda";
            case "acreencia" -> "Carga de acreencia";
            case "factura" -> "Carga de factura";
            case "movimientos" -> "Carga de movimientos bancarios";
            case "registro" -> "Registro";
            case "reporte" -> "Reporte";
            case "pronostico" -> "Pronostico";
            case "administracion" -> "Administracion";
            case "notificacion", "notificaciones" -> "Notificaciones";
            default -> toTitleCase(normalized.replace("_", "-"));
        };
    }

    private String extractRoute(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return null;
        }
        String route = pickFirstNonBlank(context, "route", "pathname", "path", "url");
        if (!StringUtils.hasText(route)) {
            return null;
        }
        return route.trim();
    }

    private String resolveScreenLabelFromRoute(Map<String, Object> context) {
        String segment = extractLastRouteSegment(context);
        if (!StringUtils.hasText(segment)) {
            return null;
        }
        return resolveScreenLabelFromKey(segment);
    }

    private String extractLastRouteSegment(Map<String, Object> context) {
        String route = extractRoute(context);
        if (!StringUtils.hasText(route)) {
            return null;
        }
        String cleaned = route.trim();
        int hashIndex = cleaned.indexOf("#/");
        if (hashIndex >= 0) {
            cleaned = cleaned.substring(hashIndex + 2);
        } else {
            int loneHashIndex = cleaned.indexOf('#');
            if (loneHashIndex >= 0) {
                cleaned = cleaned.substring(loneHashIndex + 1);
            }
        }
        int queryIndex = cleaned.indexOf("?");
        if (queryIndex >= 0) {
            cleaned = cleaned.substring(0, queryIndex);
        }
        while (cleaned.endsWith("/")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }
        if (cleaned.isEmpty()) {
            return "dashboard";
        }
        int lastSlash = cleaned.lastIndexOf('/');
        if (lastSlash >= 0) {
            cleaned = cleaned.substring(lastSlash + 1);
        }
        return cleaned.isBlank() ? null : cleaned;
    }

    private boolean isMonthSegment(String value) {
        if (!StringUtils.hasText(value)) {
            return false;
        }
        return switch (value) {
            case "enero", "febrero", "marzo", "abril", "mayo", "junio",
                    "julio", "agosto", "septiembre", "setiembre",
                    "octubre", "noviembre", "diciembre" -> true;
            default -> false;
        };
    }

    private String toTitleCase(String value) {
        if (!StringUtils.hasText(value)) {
            return value;
        }
        String[] parts = value.trim().split("[\\s-]+");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part.isEmpty()) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append(" ");
            }
            String lower = part.toLowerCase();
            sb.append(Character.toUpperCase(lower.charAt(0)));
            if (lower.length() > 1) {
                sb.append(lower.substring(1));
            }
        }
        return sb.toString();
    }

    private String resolveModuleOverride(String message, String currentModule) {
        if (!StringUtils.hasText(message)) {
            return currentModule;
        }
        String lower = message.toLowerCase();

        if (matchesAny(lower, "registro", "carga", "movimientos", "facturas", "conciliacion")) {
            return "registro";
        }
        if (matchesAny(lower, "reporte", "reportes", "cashflow", "flujo de caja", "estado de resultado",
                "estado de resultados", "p&l", "pyl", "dashboard")) {
            return "reporte";
        }
        if (matchesAny(lower, "pronostico", "pronóstico", "presupuesto", "presupuestos")) {
            return "pronostico";
        }
        if (matchesAny(lower, "administracion", "administración", "perfil", "organizacion", "organización", "roles",
                "invitaciones", "historial")) {
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

    private String truncate(String value, int maxLen) {
        if (value == null || value.length() <= maxLen) {
            return value;
        }
        return value.substring(0, maxLen) + "...";
    }

    public record ChatbotResult(String responseText, String rawText) {
    }
}
