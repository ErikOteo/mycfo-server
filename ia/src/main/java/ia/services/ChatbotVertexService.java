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
import java.util.regex.Matcher;
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
                    "que m[oó]dulo es este|que pantalla es|que estoy viendo|que veo|que veo aca|que veo aquí|" +
                    "que es esto que veo|donde estoy parado)\\b");
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
            "(?i)\\b(qu[eé] fecha es|qu[eé] d[ií]a es|qu[eé] d[ií]a|fecha|d[ií]a|hoy|" +
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
    private static final Pattern BUDGET_EXISTENCE_PATTERN = Pattern.compile(
            "(?i)\\b(tengo|tenes|hay|existe|existen|alg[uú]n|alguna|alguno|ningun|ningÃºn|ninguna)\\b");
    private static final Pattern BUDGET_COUNT_PATTERN = Pattern.compile(
            "(?i)\\b(cuantos|cuÃ¡ntos|cantidad|numero|nÃºmero)\\b");
    private static final Pattern EMOJI_PATTERN = Pattern.compile(
            "[\\x{1F300}-\\x{1FAFF}\\x{2600}-\\x{27BF}]");
    private static final Pattern LIST_PREFIX_PATTERN = Pattern.compile("^\\s*([\\-*+•·]|\\d+\\.)\\s+");
    private static final Pattern HEADING_PREFIX_PATTERN = Pattern.compile("^\\s*#{1,6}\\s+");
    private static final Pattern QUOTE_PREFIX_PATTERN = Pattern.compile("^\\s*>\\s+");
    private static final Pattern MANUAL_REFERENCE_PATTERN = Pattern.compile("(?i)\\b(manual|pdf|documento adjunto|base de conocimiento)\\b");
    private static final Pattern TOOL_CALL_PATTERN = Pattern.compile("@@CALL_TOOL:([A-Z_]+)(?:\\s*(\\{.*?\\}))?@@", Pattern.DOTALL);
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
    private final DataRetrievalService dataRetrievalService;
    private final RestTemplate restTemplate = new RestTemplate();

    public ChatbotResult chat(String message, String module, Map<String, Object> context, String userSub, String authorization) {
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

        if (isLocationQuestion(trimmedMessage)) {
            String locationPrompt = buildLocationSummaryPrompt(resolvedModule, context);
            if (!StringUtils.hasText(locationPrompt)) {
                return new ChatbotResult(buildLocationResponse(resolvedModule, context), "");
            }
            promptMessage = locationPrompt;
            forceManual = true;
        }

        if (isDateQuestion(trimmedMessage)) {
            return new ChatbotResult(buildDateResponse(trimmedMessage), "");
        }

        if (isOutOfScope(trimmedMessage)) {
            return new ChatbotResult(ChatbotPolicy.OUT_OF_SCOPE_RESPONSE, "");
        }

        String targetHint = resolveTargetScreenHint(trimmedMessage);
        boolean dataRequest = isDataRequest(trimmedMessage) && !isHowToQuestion(trimmedMessage);
        ToolExecution autoTool = dataRequest
                ? maybeAutoTool(trimmedMessage, context, userSub, authorization)
                : null;
        if (autoTool != null && !autoTool.ok() && "missing_params".equals(autoTool.error())) {
            return new ChatbotResult(buildMissingParamsResponse(autoTool), "");
        }

        ExternalFetchInfo externalFetch = extractExternalFetchInfo(context);
        if (autoTool == null && externalFetch != null && !externalFetch.isOk()) {
            return new ChatbotResult(buildExternalFetchResponse(externalFetch), "");
        }
        boolean externalFetchOk = externalFetch != null && externalFetch.isOk();
        if (autoTool != null && autoTool.ok()) {
            promptMessage = buildToolFollowupMessage(promptMessage, autoTool);
        }

        if (autoTool == null && dataRequest
                && StringUtils.hasText(targetHint) && isTargetScreenDifferent(context, targetHint) && !externalFetchOk) {
            return new ChatbotResult(buildMissingDataResponse(targetHint), "");
        }

        if (autoTool == null && isBudgetQuestion(trimmedMessage) && !isHowToQuestion(trimmedMessage)) {
            if (StringUtils.hasText(targetHint) && isTargetScreenDifferent(context, targetHint) && !externalFetchOk) {
                return new ChatbotResult(buildMissingDataResponse(targetHint), "");
            }
            if (isBudgetExistenceQuestion(trimmedMessage) || isBudgetCountQuestion(trimmedMessage) || wantsBudgetNames(trimmedMessage)) {
                BudgetInfo budgetInfo = extractBudgetInfo(context);
                if (budgetInfo != null && budgetInfo.count > 0) {
                    return new ChatbotResult(buildBudgetSummaryResponse(trimmedMessage, budgetInfo), "");
                }
                if (hasExplicitBudgetZero(context)) {
                    return new ChatbotResult(ChatbotPolicy.NO_BUDGETS_RESPONSE, "");
                }
                String hint = StringUtils.hasText(targetHint) ? targetHint : "Pronostico > Presupuestos";
                return new ChatbotResult(buildMissingDataResponse(hint), "");
            }
        }

        if (autoTool == null && isBudgetQuestion(trimmedMessage) && !isHowToQuestion(trimmedMessage) && !hasBudgetData(context)) {
            if (hasExplicitBudgetZero(context)) {
                return new ChatbotResult(ChatbotPolicy.NO_BUDGETS_RESPONSE, "");
            }
            String hint = StringUtils.hasText(targetHint) ? targetHint : "Pronostico > Presupuestos";
            return new ChatbotResult(buildMissingDataResponse(hint), "");
        }

        if (autoTool == null && dataRequest && !hasUsableData(context)) {
            if (StringUtils.hasText(targetHint)) {
                return new ChatbotResult(buildMissingDataResponse(targetHint), "");
            }
            return new ChatbotResult(ChatbotPolicy.NO_DATA_RESPONSE, "");
        }

        if (isHowToQuestion(trimmedMessage) && !isLocalActionQuestion(trimmedMessage)) {
            if (StringUtils.hasText(targetHint)) {
                promptMessage = "Pantalla solicitada: " + targetHint + ".\n" + promptMessage;
            }
        }

        if (isInterpretationRequest(trimmedMessage)) {
            promptMessage = buildInterpretationPrompt(promptMessage, context);
        }
        boolean includeManual = forceManual || shouldAttachManual(promptMessage);

        VertexResponse first = callVertex(resolvedModule, promptMessage, context, includeManual);
        ToolCall toolCall = parseToolCall(first.cleaned());
        if (toolCall != null) {
            ToolExecution execution = executeTool(toolCall.name(), toolCall.params(), userSub, authorization);
            String toolPromptMessage = buildToolFollowupMessage(promptMessage, execution);
            VertexResponse second = callVertex(resolvedModule, toolPromptMessage, context, includeManual);
            ToolCall secondCall = parseToolCall(second.cleaned());
            if (secondCall != null) {
                return new ChatbotResult(ChatbotPolicy.NO_DATA_RESPONSE, second.raw());
            }
            return new ChatbotResult(second.cleaned(), second.raw());
        }
        return new ChatbotResult(first.cleaned(), first.raw());
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

    private VertexResponse callVertex(String module, String promptMessage, Map<String, Object> context, boolean includeManual) {
        String prompt = buildPrompt(module, promptMessage, context);
        String endpoint = String.format(
                "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent",
                properties.getLocation(),
                properties.getProjectId(),
                properties.getLocation(),
                properties.getModel());

        String token = resolveAccessToken();
        Map<String, Object> requestBody = buildRequestBody(ChatbotPolicy.SYSTEM_PROMPT, prompt, includeManual);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            String payload = objectMapper.writeValueAsString(requestBody);
            log.info("Enviando mensaje a Vertex AI. Modulo: {}, Endpoint: {}", module, endpoint);
            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    new HttpEntity<>(payload, headers),
                    String.class);

            String raw = extractTextFromResponse(response.getBody());
            String cleaned = normalizePlainText(stripCodeFences(raw)).trim();
            log.info("Respuesta de Vertex AI (recortada): {}", truncate(cleaned, 1000));
            return new VertexResponse(cleaned, raw);
        } catch (RestClientResponseException ex) {
            log.error("Vertex AI respondio con error HTTP {}: {}", ex.getRawStatusCode(), ex.getResponseBodyAsString());
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Error al consultar Vertex AI.");
        } catch (Exception ex) {
            log.error("Error consultando Vertex AI", ex);
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Error al procesar el mensaje.");
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
        if (isHowToQuestion(message) && !isLocalActionQuestion(message)) {
            contextBlock = "Contexto de pantalla: no relevante para esta consulta.";
            moduleHint = "Estas asistiendo en MyCFO. Responde con foco en la funcionalidad solicitada, aunque sea de otro modulo.";
        }

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
                .filter(line -> !MANUAL_REFERENCE_PATTERN.matcher(line).find())
                .collect(Collectors.toList());

        return String.join("\n", lines);
    }

    private ToolCall parseToolCall(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }
        Matcher matcher = TOOL_CALL_PATTERN.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        String name = matcher.group(1);
        String json = matcher.group(2);
        Map<String, Object> params = parseToolParams(json);
        return new ToolCall(name, params);
    }

    private Map<String, Object> parseToolParams(String json) {
        if (!StringUtils.hasText(json)) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json,
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.warn("No se pudo parsear parametros de tool call: {}", json);
            return Map.of();
        }
    }

    private ToolExecution executeTool(String toolName, Map<String, Object> params, String userSub, String authorization) {
        String safeToolName = StringUtils.hasText(toolName) ? toolName : "UNKNOWN_TOOL";
        ToolName tool = ToolName.from(toolName);
        if (tool == null) {
            return ToolExecution.error(safeToolName, "unsupported_tool");
        }
        if (!StringUtils.hasText(userSub)) {
            return ToolExecution.error(tool.name(), "missing_user");
        }
        try {
            Map<String, Object> data = switch (tool) {
                case GET_BALANCE -> dataRetrievalService.getBalance(
                        userSub,
                        authorization,
                        stringValue(params != null ? params.get("moneda") : null));
                case SEARCH_MOVEMENTS -> dataRetrievalService.searchMovements(
                        userSub,
                        authorization,
                        params != null ? params : Map.of());
                case GET_PENDING_TASKS -> dataRetrievalService.getPendingTasks(
                        userSub,
                        authorization,
                        params != null ? params : Map.of());
                case GET_SCREEN_DATA -> dataRetrievalService.getScreenData(
                        stringValue(params != null ? params.get("screen") : null),
                        params != null ? params : Map.of(),
                        userSub,
                        authorization);
            };
            if (data == null || data.isEmpty()) {
                return ToolExecution.error(tool.name(), "no_data");
            }
            if (data.containsKey("error")) {
                String error = stringValue(data.get("error"));
                if ("missing_params".equals(error)) {
                    List<String> missing = toStringList(data.get("missing"));
                    return ToolExecution.missing(tool.name(), missing);
                }
                return ToolExecution.error(tool.name(), error);
            }
            return ToolExecution.ok(tool.name(), data);
        } catch (Exception ex) {
            log.error("Error ejecutando herramienta {}", tool.name(), ex);
            return ToolExecution.error(tool.name(), "tool_error");
        }
    }

    private String buildToolFollowupMessage(String promptMessage, ToolExecution execution) {
        String base = StringUtils.hasText(promptMessage) ? promptMessage.trim() : "Consulta del usuario.";
        String payload = safeWriteJson(execution.toPayload());
        return String.join(
                "\n",
                base,
                "Resultado herramienta " + execution.tool() + ": " + payload,
                "Si ok es false o hay error, indica que no tenes acceso a esos datos.",
                "Responde solo con estos datos reales."
        );
    }

    private ToolExecution maybeAutoTool(String message, Map<String, Object> context, String userSub, String authorization) {
        if (!StringUtils.hasText(userSub)) {
            return null;
        }
        String lower = normalizeKey(message);
        Map<String, Object> params = buildAutoToolParams(message, context);
        ToolName tool = resolveToolForMessage(lower, params);
        if (tool == null) {
            return null;
        }
        if (tool == ToolName.GET_SCREEN_DATA && !params.containsKey("screen")) {
            return null;
        }
        return executeTool(tool.name(), params, userSub, authorization);
    }

    private ToolName resolveToolForMessage(String normalizedMessage, Map<String, Object> params) {
        if (!StringUtils.hasText(normalizedMessage)) {
            return null;
        }
        if (matchesAny(normalizedMessage, "saldo", "balance", "caja", "saldo total")) {
            return ToolName.GET_BALANCE;
        }
        if (matchesAny(normalizedMessage, "conciliacion", "conciliar", "pendiente", "pendientes")) {
            return ToolName.GET_PENDING_TASKS;
        }
        String screenKey = stringValue(params.get("screen"));
        if (StringUtils.hasText(screenKey)) {
            return ToolName.GET_SCREEN_DATA;
        }
        if (matchesAny(normalizedMessage, "movimiento", "movimientos", "ingreso", "egreso", "factura")) {
            return ToolName.SEARCH_MOVEMENTS;
        }
        return null;
    }

    private Map<String, Object> buildAutoToolParams(String message, Map<String, Object> context) {
        Map<String, Object> params = new LinkedHashMap<>();
        String screenKey = resolveTargetScreenKey(message);
        if (!StringUtils.hasText(screenKey)) {
            screenKey = resolveCurrentScreenKey(context);
        }
        if (StringUtils.hasText(screenKey)) {
            params.put("screen", screenKey);
        }
        Integer year = extractYearFromMessage(message);
        Integer month = extractMonthFromMessage(message);
        if (year != null) params.put("anio", year);
        if (month != null) params.put("mes", month);
        String currency = extractCurrencyFromContext(context);
        if (StringUtils.hasText(currency)) params.put("moneda", currency);
        Integer userId = extractUserIdFromContext(context);
        if (userId != null) params.put("userId", userId);
        return params;
    }

    private String resolveCurrentScreenKey(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return null;
        }
        String routeSegment = extractLastRouteSegment(context);
        if (StringUtils.hasText(routeSegment)) {
            return routeSegment.toLowerCase();
        }
        Object screen = context.get("screen");
        if (screen != null && StringUtils.hasText(screen.toString())) {
            return screen.toString().trim().toLowerCase();
        }
        return null;
    }

    private String resolveTargetScreenKey(String message) {
        if (!StringUtils.hasText(message)) {
            return null;
        }
        String lower = normalizeKey(message);
        if (matchesAny(lower, "dashboard", "tablero")) {
            return "dashboard";
        }
        if (matchesAny(lower, "reporte mensual", "resumen mensual")) {
            return "reporte-mensual";
        }
        if (matchesAny(lower, "flujo de caja", "cashflow", "cash flow")) {
            return "flujo-de-caja";
        }
        if (matchesAny(lower, "estado de resultados", "estado de resultado", "p l", "p&l", "pyl")) {
            return "estado-de-resultados";
        }
        if (matchesAny(lower, "presupuesto", "presupuestos")) {
            return "presupuestos";
        }
        if (matchesAny(lower, "pronostico continuo", "pronostico continuo", "rolling")) {
            return "pronostico-continuo";
        }
        if (matchesAny(lower, "pronostico fijo")) {
            return "pronostico-fijo";
        }
        if (matchesAny(lower, "ver movimientos", "movimientos cargados", "movimientos")) {
            return "ver-movimientos";
        }
        if (matchesAny(lower, "ver facturas", "facturas")) {
            return "ver-facturas";
        }
        if (matchesAny(lower, "conciliacion", "conciliar")) {
            return "conciliacion";
        }
        if (matchesAny(lower, "carga movimientos", "carga de movimientos")) {
            return "carga-movimientos";
        }
        if (matchesAny(lower, "mercado pago", "mercado-pago")) {
            return "mercado-pago";
        }
        if (matchesAny(lower, "recordatorios")) {
            return "recordatorios";
        }
        if (matchesAny(lower, "configuracion notificaciones", "configuracion de notificaciones")) {
            return "configuracion-notificaciones";
        }
        if (matchesAny(lower, "notificaciones", "notificacion", "alertas")) {
            return "listado-notificaciones";
        }
        if (matchesAny(lower, "perfil")) {
            return "perfil";
        }
        if (matchesAny(lower, "organizacion", "empresa")) {
            return "organizacion";
        }
        return null;
    }

    private Integer extractYearFromMessage(String message) {
        if (!StringUtils.hasText(message)) {
            return null;
        }
        Matcher matcher = Pattern.compile("\\b(20\\d{2}|19\\d{2})\\b").matcher(message);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignore) {
                return null;
            }
        }
        return null;
    }

    private Integer extractMonthFromMessage(String message) {
        if (!StringUtils.hasText(message)) {
            return null;
        }
        String normalized = normalizeKey(message);
        if (normalized.contains("enero")) return 1;
        if (normalized.contains("febrero")) return 2;
        if (normalized.contains("marzo")) return 3;
        if (normalized.contains("abril")) return 4;
        if (normalized.contains("mayo")) return 5;
        if (normalized.contains("junio")) return 6;
        if (normalized.contains("julio")) return 7;
        if (normalized.contains("agosto")) return 8;
        if (normalized.contains("septiembre") || normalized.contains("setiembre")) return 9;
        if (normalized.contains("octubre")) return 10;
        if (normalized.contains("noviembre")) return 11;
        if (normalized.contains("diciembre")) return 12;
        return null;
    }

    private String extractCurrencyFromContext(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return null;
        }
        String currency = stringValue(context.get("currency"));
        if (StringUtils.hasText(currency)) {
            return currency;
        }
        return stringValue(context.get("moneda"));
    }

    private Integer extractUserIdFromContext(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return null;
        }
        Object userId = context.get("userId");
        if (userId instanceof Number number) {
            return number.intValue();
        }
        if (userId instanceof String text) {
            try {
                return Integer.parseInt(text.trim());
            } catch (NumberFormatException ignore) {
                return null;
            }
        }
        return null;
    }

    private String buildMissingParamsResponse(ToolExecution execution) {
        String missing = formatMissingParams(execution.missing());
        if (StringUtils.hasText(missing)) {
            return String.join(
                    "\n",
                    "Para responder necesito " + missing + ".",
                    "Decime esos datos y vuelvo a intentarlo."
            );
        }
        return ChatbotPolicy.NO_DATA_RESPONSE;
    }

    private String safeWriteJson(Map<String, Object> payload) {
        if (payload == null) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            return "{}";
        }
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
        if (isLocationQuestion(message)) {
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

    private boolean isBudgetExistenceQuestion(String message) {
        if (message == null) {
            return false;
        }
        String lower = message.toLowerCase();
        if (!lower.contains("presupuesto")) {
            return false;
        }
        return BUDGET_EXISTENCE_PATTERN.matcher(lower).find();
    }

    private boolean isBudgetCountQuestion(String message) {
        if (message == null) {
            return false;
        }
        String lower = message.toLowerCase();
        if (!lower.contains("presupuesto")) {
            return false;
        }
        return BUDGET_COUNT_PATTERN.matcher(lower).find();
    }

    private boolean wantsBudgetNames(String message) {
        if (message == null) {
            return false;
        }
        String lower = message.toLowerCase();
        if (!lower.contains("presupuesto")) {
            return false;
        }
        return matchesAny(lower, "nombre", "nombres", "se llama", "se llaman", "como se llama", "cómo se llama");
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
        String screenLabel = resolveScreenLabel(context);
        if (StringUtils.hasText(screenLabel) && screenLabel.toLowerCase().contains("presupuesto")) {
            return true;
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
        Object presupuesto = context.get("presupuesto");
        if (presupuesto instanceof Map && !((Map<?, ?>) presupuesto).isEmpty()) {
            return true;
        }
        if (presupuesto != null && !(presupuesto instanceof Map) && !(presupuesto instanceof java.util.Collection)) {
            return true;
        }
        Object detalleMensual = context.get("detalleMensual");
        if (detalleMensual instanceof java.util.Collection && !((java.util.Collection<?>) detalleMensual).isEmpty()) {
            return true;
        }
        Object budget = context.get("budget");
        if (budget instanceof Map && !((Map<?, ?>) budget).isEmpty()) {
            return true;
        }
        return budget != null && !(budget instanceof Map) && !(budget instanceof java.util.Collection);
    }

    private boolean hasBudgetDataForExistence(Map<String, Object> context) {
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
        Object presupuesto = context.get("presupuesto");
        if (presupuesto instanceof Map && !((Map<?, ?>) presupuesto).isEmpty()) {
            return true;
        }
        if (presupuesto != null && !(presupuesto instanceof Map) && !(presupuesto instanceof java.util.Collection)) {
            return true;
        }
        Object detalleMensual = context.get("detalleMensual");
        if (detalleMensual instanceof java.util.Collection && !((java.util.Collection<?>) detalleMensual).isEmpty()) {
            return true;
        }
        Object budget = context.get("budget");
        if (budget instanceof Map && !((Map<?, ?>) budget).isEmpty()) {
            return true;
        }
        return budget != null && !(budget instanceof Map) && !(budget instanceof java.util.Collection);
    }

    private BudgetInfo extractBudgetInfo(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return null;
        }
        int count = -1;
        Object totalPresupuestos = context.get("totalPresupuestos");
        if (totalPresupuestos instanceof Number) {
            count = ((Number) totalPresupuestos).intValue();
        } else if (totalPresupuestos instanceof String) {
            try {
                count = Integer.parseInt(((String) totalPresupuestos).trim());
            } catch (NumberFormatException ignored) {
            }
        }

        List<String> names = new java.util.ArrayList<>();
        Object externalData = context.get("externalData");
        if (externalData instanceof Map<?, ?> externalMap) {
            Object presupuestosBlock = externalMap.get("presupuestos");
            if (presupuestosBlock instanceof Map<?, ?> presupuestosMap) {
                Object list = presupuestosMap.get("presupuestos");
                names.addAll(extractBudgetNamesFromList(list));
                if (count < 0) {
                    Object total = presupuestosMap.get("totalPresupuestos");
                    if (total instanceof Number) {
                        count = ((Number) total).intValue();
                    } else if (total instanceof String) {
                        try {
                            count = Integer.parseInt(((String) total).trim());
                        } catch (NumberFormatException ignored) {
                        }
                    }
                }
            }
        }

        if (names.isEmpty()) {
            Object muestra = context.get("muestra");
            names.addAll(extractBudgetNamesFromList(muestra));
        }
        if (names.isEmpty()) {
            Object presupuestos = context.get("presupuestos");
            names.addAll(extractBudgetNamesFromList(presupuestos));
        }

        if (count < 0) {
            if (!names.isEmpty()) {
                count = names.size();
            } else if (hasBudgetDataForExistence(context)) {
                count = 1;
            }
        }

        if (count <= 0 && names.isEmpty()) {
            return null;
        }
        if (count < 0) {
            count = names.size();
        }
        return new BudgetInfo(count, names);
    }

    private List<String> extractBudgetNamesFromList(Object list) {
        if (!(list instanceof java.util.Collection<?> collection)) {
            return List.of();
        }
        List<String> names = new java.util.ArrayList<>();
        for (Object item : collection) {
            if (item instanceof Map<?, ?> map) {
                Object nombre = map.get("nombre");
                if (nombre == null) {
                    nombre = map.get("name");
                }
                if (nombre != null) {
                    String text = nombre.toString().trim();
                    if (!text.isEmpty()) {
                        names.add(text);
                    }
                }
            } else if (item != null) {
                String text = item.toString().trim();
                if (!text.isEmpty()) {
                    names.add(text);
                }
            }
        }
        return names;
    }

    private String buildBudgetSummaryResponse(String message, BudgetInfo info) {
        boolean wantsCount = isBudgetCountQuestion(message);
        boolean wantsNames = wantsBudgetNames(message);
        StringBuilder sb = new StringBuilder();
        if (wantsCount) {
            sb.append("Tenes ").append(info.count).append(" presupuestos cargados en el sistema.");
        } else {
            sb.append("Tenes presupuestos cargados en el sistema.");
        }
        if (wantsNames) {
            List<String> names = info.names.stream().filter(StringUtils::hasText).distinct().collect(Collectors.toList());
            if (!names.isEmpty()) {
                sb.append("\n");
                sb.append("Los nombres son: ").append(String.join(", ", names)).append(".");
            } else {
                sb.append("\n");
                sb.append("No tengo los nombres disponibles en este momento.");
            }
        }
        return sb.toString();
    }

    private record BudgetInfo(int count, List<String> names) {
    }

    private boolean hasExplicitBudgetZero(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return false;
        }
        Object totalPresupuestos = context.get("totalPresupuestos");
        if (totalPresupuestos instanceof Number) {
            return ((Number) totalPresupuestos).longValue() == 0L;
        }
        if (totalPresupuestos instanceof String) {
            try {
                return Long.parseLong(((String) totalPresupuestos).trim()) == 0L;
            } catch (NumberFormatException ignored) {
            }
        }
        String screenLabel = resolveScreenLabel(context);
        boolean isPresupuestoScreen = StringUtils.hasText(screenLabel)
                && screenLabel.toLowerCase().contains("presupuesto");
        Object muestra = context.get("muestra");
        if (isPresupuestoScreen && context.containsKey("muestra")
                && muestra instanceof java.util.Collection
                && ((java.util.Collection<?>) muestra).isEmpty()) {
            return true;
        }
        Object presupuestos = context.get("presupuestos");
        if (isPresupuestoScreen && context.containsKey("presupuestos")
                && presupuestos instanceof java.util.Collection
                && ((java.util.Collection<?>) presupuestos).isEmpty()) {
            return true;
        }
        return false;
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
                "Responde en texto plano con 2 o 3 parrafos cortos.",
                "Primero indica la ubicacion. Si la pantalla es Dashboard, responde solo 'Estas en el Dashboard' sin mencionar otro modulo.",
                "Luego resume que se ve en esa pantalla y que puede hacer el usuario ahi.",
                "No uses listas ni ejemplos con datos.",
                "No menciones el manual ni PDF."
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

        if (matchesAny(lower, "registro", "carga", "carga de datos", "cargar datos", "movimientos",
                "factura", "facturas", "facturacion", "facturación", "comprobante", "comprobantes", "conciliacion")) {
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

    private String resolveTargetScreenHint(String message) {
        if (!StringUtils.hasText(message)) {
            return null;
        }
        String lower = message.toLowerCase();

        if (matchesAny(lower, "ver movimientos", "movimientos cargados")) {
            return "Registro > Movimientos";
        }
        if (matchesAny(lower, "ver facturas")) {
            return "Registro > Facturas";
        }
        if (matchesAny(lower, "carga movimientos", "carga de movimientos")) {
            return "Vinculacion bancaria > Carga de movimientos";
        }
        if (matchesAny(lower, "mercado pago", "mercado-pago")) {
            return "Vinculacion bancaria > Mercado Pago";
        }
        if (matchesAny(lower, "presupuesto nuevo", "nuevo presupuesto")) {
            return "Pronostico > Presupuestos > Nuevo";
        }
        if (matchesAny(lower, "conciliacion", "conciliaciÃ³n", "conciliar")) {
            return "Conciliacion";
        }
        if (matchesAny(lower, "factura", "facturas", "facturacion", "facturaciÃ³n", "comprobante", "comprobantes")) {
            return "Carga de datos > Facturas";
        }
        if (matchesAny(lower, "movimientos bancarios", "movimiento bancario", "movimientos", "movimiento", "extracto")) {
            return "Carga de datos > Movimientos bancarios";
        }
        if (matchesAny(lower, "ingreso", "ingresos")) {
            return "Carga de datos > Ingresos";
        }
        if (matchesAny(lower, "egreso", "egresos")) {
            return "Carga de datos > Egresos";
        }
        if (matchesAny(lower, "deuda", "deudas")) {
            return "Carga de datos > Deudas";
        }
        if (matchesAny(lower, "acreencia", "acreencias")) {
            return "Carga de datos > Acreencias";
        }
        if (matchesAny(lower, "presupuesto", "presupuestos")) {
            return "Pronostico > Presupuestos";
        }
        if (matchesAny(lower, "pronostico fijo", "pronÃ³stico fijo")) {
            return "Pronostico > Pronostico fijo";
        }
        if (matchesAny(lower, "pronostico continuo", "pronÃ³stico continuo", "rolling forecast")) {
            return "Pronostico > Pronostico continuo";
        }
        if (matchesAny(lower, "reporte mensual")) {
            return "Reportes > Reporte mensual";
        }
        if (matchesAny(lower, "flujo de caja", "cashflow", "cash flow")) {
            return "Reportes > Flujo de caja";
        }
        if (matchesAny(lower, "estado de resultados", "estado de resultado", "p&l", "pyl")) {
            return "Reportes > Estado de resultados";
        }
        if (matchesAny(lower, "dashboard", "tablero")) {
            return "Dashboard";
        }
        if (matchesAny(lower, "recordatorios", "recordatorio")) {
            return "Notificaciones > Recordatorios";
        }
        if (matchesAny(lower, "configuracion de notificaciones", "configurar notificaciones", "preferencias de notificaciones")) {
            return "Notificaciones > Configuracion";
        }
        if (matchesAny(lower, "notificaciones", "notificacion", "alertas")) {
            return "Notificaciones > Centro de notificaciones";
        }
        if (matchesAny(lower, "perfil")) {
            return "Administracion > Perfil";
        }
        if (matchesAny(lower, "organizacion", "organizaciÃ³n")) {
            return "Administracion > Organizacion";
        }
        if (matchesAny(lower, "roles")) {
            return "Administracion > Roles";
        }
        if (matchesAny(lower, "invitaciones", "invitar")) {
            return "Administracion > Invitaciones";
        }
        if (matchesAny(lower, "carga de datos", "cargar datos", "carga")) {
            return "Carga de datos";
        }
        return null;
    }

    private boolean isTargetScreenDifferent(Map<String, Object> context, String targetHint) {
        if (!StringUtils.hasText(targetHint)) {
            return false;
        }
        String current = resolveScreenLabel(context);
        if (!StringUtils.hasText(current)) {
            return true;
        }
        String target = targetHint;
        int marker = target.lastIndexOf('>');
        if (marker >= 0 && marker < target.length() - 1) {
            target = target.substring(marker + 1).trim();
        }
        String normTarget = normalizeKey(target);
        String normCurrent = normalizeKey(current);
        if (!StringUtils.hasText(normTarget)) {
            return false;
        }
        return !normCurrent.contains(normTarget) && !normTarget.contains(normCurrent);
    }

    private String normalizeKey(String value) {
        if (value == null) {
            return "";
        }
        String normalized = value.toLowerCase()
                .replace("Ã¡", "a")
                .replace("Ã©", "e")
                .replace("Ã­", "i")
                .replace("Ã³", "o")
                .replace("Ãº", "u")
                .replace("Ã±", "n");
        normalized = normalized.replaceAll("[^a-z0-9 ]", " ").trim();
        return normalized.replaceAll("\\s+", " ");
    }

    private String buildMissingDataResponse(String targetHint) {
        String hint = StringUtils.hasText(targetHint) ? targetHint.trim() : "esa pantalla";
        return String.join(
                "\n",
                "Para responder necesito los datos reales de " + hint + ".",
                "Abrila y volve a hacer la consulta."
        );
    }

    private ExternalFetchInfo extractExternalFetchInfo(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return null;
        }
        Object external = context.get("externalFetch");
        if (!(external instanceof Map)) {
            return null;
        }
        Map<?, ?> externalMap = (Map<?, ?>) external;
        String status = stringValue(externalMap.get("status"));
        if (!StringUtils.hasText(status)) {
            return null;
        }
        String target = stringValue(externalMap.get("target"));
        List<String> missing = toStringList(externalMap.get("missing"));
        return new ExternalFetchInfo(status.trim().toLowerCase(), target, missing);
    }

    private String buildExternalFetchResponse(ExternalFetchInfo info) {
        String target = StringUtils.hasText(info.target) ? info.target : "esa pantalla";
        if ("missing-params".equals(info.status)) {
            String missingText = formatMissingParams(info.missing);
            if (StringUtils.hasText(missingText)) {
                return String.join(
                        "\n",
                        "Para responder necesito " + missingText + " de " + target + ".",
                        "Decime esos datos o abrila y volve a hacer la consulta."
                );
            }
            return String.join(
                    "\n",
                    "Para responder necesito datos reales de " + target + ".",
                    "Abrila y volve a hacer la consulta."
            );
        }
        if ("failed".equals(info.status) || "unsupported".equals(info.status)) {
            return String.join(
                    "\n",
                    "No pude obtener los datos reales de " + target + " desde esta pantalla.",
                    "Abrila y volve a hacer la consulta."
            );
        }
        return null;
    }

    private String formatMissingParams(List<String> missing) {
        if (missing == null || missing.isEmpty()) {
            return "";
        }
        List<String> labels = missing.stream()
                .map(this::mapMissingParamLabel)
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());
        if (labels.isEmpty()) {
            return "";
        }
        if (labels.size() == 1) {
            return labels.get(0);
        }
        return String.join(" y ", labels);
    }

    private String mapMissingParamLabel(String key) {
        if (!StringUtils.hasText(key)) {
            return "";
        }
        return switch (key.trim().toLowerCase()) {
            case "anio", "aÃ±o", "year" -> "el anio";
            case "mes", "month" -> "el mes";
            default -> key;
        };
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    private List<String> toStringList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream()
                    .map(this::stringValue)
                    .filter(StringUtils::hasText)
                    .collect(Collectors.toList());
        }
        String single = stringValue(value);
        if (StringUtils.hasText(single)) {
            return List.of(single);
        }
        return List.of();
    }

    private static final class ExternalFetchInfo {
        private final String status;
        private final String target;
        private final List<String> missing;

        private ExternalFetchInfo(String status, String target, List<String> missing) {
            this.status = status;
            this.target = target;
            this.missing = missing == null ? List.of() : missing;
        }

        private boolean isOk() {
            return "ok".equals(status);
        }
    }

    private enum ToolName {
        GET_BALANCE,
        SEARCH_MOVEMENTS,
        GET_PENDING_TASKS,
        GET_SCREEN_DATA;

        private static ToolName from(String value) {
            if (!StringUtils.hasText(value)) {
                return null;
            }
            try {
                return ToolName.valueOf(value.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
    }

    private record ToolCall(String name, Map<String, Object> params) {
    }

    private record ToolExecution(String tool, boolean ok, Map<String, Object> data, String error, List<String> missing) {
        private static ToolExecution ok(String tool, Map<String, Object> data) {
            return new ToolExecution(tool, true, data, null, List.of());
        }

        private static ToolExecution error(String tool, String error) {
            return new ToolExecution(tool, false, Map.of(), error, List.of());
        }

        private static ToolExecution missing(String tool, List<String> missing) {
            return new ToolExecution(tool, false, Map.of(), "missing_params", missing == null ? List.of() : missing);
        }

        private Map<String, Object> toPayload() {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("tool", tool);
            payload.put("ok", ok);
            if (data != null && !data.isEmpty()) {
                payload.put("data", data);
            }
            if (StringUtils.hasText(error)) {
                payload.put("error", error);
            }
            if (missing != null && !missing.isEmpty()) {
                payload.put("missing", missing);
            }
            return payload;
        }
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

    private record VertexResponse(String cleaned, String raw) {
    }

    public record ChatbotResult(String responseText, String rawText) {
    }
}
