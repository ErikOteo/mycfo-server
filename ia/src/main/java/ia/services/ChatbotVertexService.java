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
    private static final String MANUAL_INTEGRAL_MD_CLASSPATH = "knowledge/manual_integral_mycfo.md";
    private static final Pattern OUT_OF_SCOPE_PATTERN = Pattern.compile(
            "(?i)\\b(" +
                    "calcula|calcular|recalcula|recalcular|sumar|suma|restar|resta|" +
                    "multiplicar|multiplica|dividir|divide|porcentaje|promedio|tasa|" +
                    "variacion|crecimiento|simulacion|simula|estima|estimacion" +
                    ")\\b");
    private static final Pattern SCOPE_QUESTION_PATTERN = Pattern.compile(
            "(?i)\\b(que podes hacer|que puedes hacer|cual es tu alcance|cu[aá]l es tu alcance|" +
                    "para que servis|para que serv[íi]s|para qu[eé] serv[íi]s|ayuda|que haces)\\b");
    private static final Pattern LOCAL_ACTION_PATTERN = Pattern.compile(
            "(?i)\\b(que puedo hacer|que pod[eé]s hacer|que puedes hacer|que se puede hacer)\\b" +
                    ".*\\b(aca|aqui|aquí|esta pantalla|este modulo|este módulo|esta seccion|esta sección|este lugar)\\b");
    private static final Pattern LOCATION_QUESTION_PATTERN = Pattern.compile(
            "(?i)\\b(donde estoy|en que modulo estoy|en qué modulo estoy|que modulo es este|" +
                    "que m[oó]dulo es este|que pantalla es|en que pantalla estoy|en qué pantalla estoy|" +
                    "que pantalla estoy viendo|que pantalla estoy|pantalla actual|que estoy viendo|que veo|" +
                    "que veo aca|que veo aquí|que es esto que veo|donde estoy parado)\\b");
    private static final Pattern GREETING_ONLY_PATTERN = Pattern.compile(
            "(?i)^\\s*(hola|buenas|buenos dias|buen d[ií]a|buen dia|buenas tardes|buenas noches|hello|hey)\\s*[!.?]*\\s*$");
    private static final Pattern INTERPRETATION_PATTERN = Pattern.compile(
            "(?i)\\b(interpretaci[oó]n|interpretar|que significa|significa|lectura|analisis|análisis|explicaci[oó]n|explica|"
                    +
                    "que puedes decirme|que me puedes decir|que puedes decir|que me puedes contar|que ves en pantalla|sobre los datos|sobre estos datos)\\b");
    private static final Pattern IDENTITY_QUESTION_PATTERN = Pattern.compile(
            "(?i)\\b(qui[eé]n soy|mi nombre|nombre de usuario|mi usuario|usuario estoy usando|" +
                    "mi cuenta|mi perfil|mi email|mi correo|mi mail|mi tel[ée]fono|mi telefono|mi celular)\\b");
    private static final Pattern EMAIL_QUESTION_PATTERN = Pattern.compile("(?i)\\b(email|e-mail|correo|mail)\\b");
    private static final Pattern PHONE_QUESTION_PATTERN = Pattern
            .compile("(?i)\\b(tel[ée]fono|telefono|celular|celu|m[oó]vil|movil)\\b");
    private static final Pattern NAME_QUESTION_PATTERN = Pattern.compile("(?i)\\b(nombre|usuario)\\b");
    private static final Pattern DATE_QUESTION_PATTERN = Pattern.compile(
            "(?i)\\b(que fecha es|que dia es|que dia|fecha|dia|en que dia estamos|en que fecha estamos|que hora es|hora)\\b");
    private static final Pattern EXPLICIT_DATE_TIME_PATTERN = Pattern.compile(
            "(?i)\\b(que fecha es|que dia es|en que dia estamos|en que fecha estamos|que hora es|hora actual|fecha actual|fecha de hoy|dia de hoy|hoy es)\\b");
    private static final Pattern DATE_ONLY_PATTERN = Pattern.compile(
            "(?i)^\\s*(fecha|dia|hora|que fecha|que dia|que hora)\\s*[?.!]*\\s*$");
    private static final Pattern TEMPORAL_WORD_PATTERN = Pattern.compile(
            "(?i)\\b(hoy|ahora|en este momento|en este instante|actualmente|reciente|recientes)\\b");
    private static final Pattern AMBIGUOUS_TEMPORAL_PATTERN = Pattern.compile(
            "(?i)^\\s*(hoy|ahora|en este momento|en este instante|actualmente|lo de hoy|lo de ahora|lo de este momento)\\s*[?.!]*\\s*$");
    private static final Pattern TIME_QUESTION_PATTERN = Pattern.compile("(?i)\\bhora\\b");
    private static final Pattern DATA_REQUEST_PATTERN = Pattern.compile(
            "(?i)\\b(cuanto|cuantos|monto|importe|total|saldo|balance|caja|plata|dinero|efectivo|resultado|ingresos|egresos|"
                    +
                    "cash ?flow|flujo de caja|p&l|pyl|presupuesto|presupuestos|factura|facturas|" +
                    "cobro|cobros|pago|pagos|movimiento|movimientos|reporte|reportes|estado de resultados|" +
                    "deuda|deudas|acreencia|acreencias|kpi|indicador|indicadores|numero|numeros|" +
                    "pendiente|pendientes|recordatorio|recordatorios|notificacion|notificaciones|" +
                    "pronostico|pronosticos|forecast|conciliado|conciliados|conciliar|conciliacion|" +
                    "movimento|movimentos|otro|otra|mas|más|siguiente)\\b");
    private static final Pattern HOW_TO_PATTERN = Pattern.compile(
            "(?i)\\b(pasos|procedimiento|instrucciones|guia|tutorial|ayuda|" +
                    "como hago|como puedo|dime como|dime donde|que hace|para que sirve|" +
                    "donde encuentro|donde esta|configurar|activar|desactivar|crear|" +
                    "editar|cargar|importar|conciliar|generar)\\b");
    private static final Pattern BUDGET_PATTERN = Pattern.compile("(?i)\\bpresupuesto(s)?\\b");
    private static final Pattern PRONOSTICO_PATTERN = Pattern.compile("(?i)\\b(pronostico|pronosticos|forecast)\\b");
    private static final Pattern BUDGET_EXISTENCE_PATTERN = Pattern.compile(
            "(?i)\\b(tengo|tenes|hay|existe|existen|alg[uú]n|alguna|alguno|ningun|ningÃºn|ninguna)\\b");
    private static final Pattern BUDGET_COUNT_PATTERN = Pattern.compile(
            "(?i)\\b(cuantos|cuÃ¡ntos|cantidad|numero|nÃºmero)\\b");
    private static final Pattern EMOJI_PATTERN = Pattern.compile(
            "[\\x{1F300}-\\x{1FAFF}\\x{2600}-\\x{27BF}]");
    private static final Pattern LIST_PREFIX_PATTERN = Pattern.compile("^\\s*([\\-*+•·]|\\d+\\.)\\s+");
    private static final Pattern HEADING_PREFIX_PATTERN = Pattern.compile("^\\s*#{1,6}\\s+");
    private static final Pattern QUOTE_PREFIX_PATTERN = Pattern.compile("^\\s*>\\s+");
    private static final Pattern MANUAL_REFERENCE_PATTERN = Pattern.compile(
            "(?i)\\b(manual|manual de usuario|pdf|base de conocimiento|guia de usuario|documento de usuario|" +
                    "documento que describe|documento del sistema|documento adjunto)\\b");
    private static final Pattern UNKNOWN_RESPONSE_PATTERN = Pattern.compile(
            "(?i)\\b(no tengo acceso|no tengo informacion|no dispongo|no cuento|no puedo|no se|no encuentro|no logro|no estoy seguro|no estoy segura)\\b");
    private static final Pattern TOOL_CALL_PATTERN = Pattern.compile(
            "@@CALL[_ ]?TOOL:([A-Za-z_]+)(?:\\s*(\\{.*?\\}))?@@",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
    private static final Pattern TOOL_CALL_LOOSE_PATTERN = Pattern.compile(
            "CALL[_ ]?TOOL\\s*:?\\s*([A-Za-z_]+)(?:\\s*(\\{.*?\\}))?",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
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
            "statusFilter");

    private final VertexAiProperties properties;
    private final ObjectMapper objectMapper;
    private final DataRetrievalService dataRetrievalService;
    private final RestTemplate restTemplate = new RestTemplate();
    private String cachedManualIntegral;

    public ChatbotResult chat(String message, String module, Map<String, Object> context,
            List<Map<String, String>> history, String userSub, String authorization) {
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

        // SEGURIDAD GLOBAL: Interceptor de permisos antes de cualquier logica
        enrichContext(context);
        if (!isHowToQuestion(trimmedMessage) && !isModuleAuthorized(trimmedMessage, context)) {
            return new ChatbotResult(ChatbotPolicy.NO_PERMISSIONS_RESPONSE, "");
        }

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

        if (isAmbiguousTemporal(trimmedMessage) && !isDataRequest(trimmedMessage)) {
            return new ChatbotResult(ChatbotPolicy.AMBIGUOUS_TEMPORAL_RESPONSE, "");
        }

        if (needsPeriodClarification(trimmedMessage)) {
            return new ChatbotResult(ChatbotPolicy.AMBIGUOUS_PERIOD_RESPONSE, "");
        }

        if (isDateQuestion(trimmedMessage)) {
            return new ChatbotResult(buildDateResponse(trimmedMessage), "");
        }

        if (isOutOfScope(trimmedMessage)) {
            return new ChatbotResult(ChatbotPolicy.OUT_OF_SCOPE_RESPONSE, "");
        }

        if (isHowToQuestion(trimmedMessage) && !isLocalActionQuestion(trimmedMessage)) {
            String override = buildHowToOverride(trimmedMessage);
            if (StringUtils.hasText(override)) {
                return new ChatbotResult(override, "");
            }
        }

        String targetHint = resolveTargetScreenHint(trimmedMessage);

        if (isLocationQuestion(trimmedMessage)) {
            // Si menciona una pantalla explicita (targetHint), dejamos que la IA responda
            // via manual
            if (!StringUtils.hasText(targetHint)) {
                String locationPrompt = buildLocationSummaryPrompt(resolvedModule, context);
                if (!StringUtils.hasText(locationPrompt)) {
                    return new ChatbotResult(buildLocationResponse(resolvedModule, context), "");
                }
                promptMessage = locationPrompt;
                forceManual = true;
            }
        }
        boolean dataRequest = isDataRequest(trimmedMessage) && !isHowToQuestion(trimmedMessage);
        boolean multiIntent = hasMultipleDataIntents(trimmedMessage);
        ToolExecution autoTool = dataRequest && !multiIntent
                ? maybeAutoTool(trimmedMessage, context, history, userSub, authorization)
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
            if (!hasToolData(autoTool)) {
                String hint = resolveMissingDataHintForMessage(trimmedMessage);
                if (StringUtils.hasText(hint)) {
                    return new ChatbotResult(buildMissingDataResponse(hint), "");
                }
                return new ChatbotResult(ChatbotPolicy.NO_DATA_RESPONSE, "");
            }
            promptMessage = buildToolFollowupMessage(promptMessage, autoTool);
        }

        if (autoTool == null && dataRequest
                && StringUtils.hasText(targetHint) && isTargetScreenDifferent(context, targetHint)
                && !externalFetchOk) {
            return new ChatbotResult(buildMissingDataResponse(targetHint), "");
        }

        if (autoTool == null && !isHowToQuestion(trimmedMessage)) {
            // Este bloque se mantiene como redundancia de seguridad
            if (isBudgetQuestion(trimmedMessage)) {
                if (!hasPermission(context, "pres", "view")) {
                    return new ChatbotResult(ChatbotPolicy.NO_PERMISSIONS_RESPONSE, "");
                }
            } else if (isPronosticoQuestion(trimmedMessage)) {
                if (!hasPermission(context, "pron", "view")) {
                    return new ChatbotResult(ChatbotPolicy.NO_PERMISSIONS_RESPONSE, "");
                }
            }
        }

        if (autoTool == null && isBudgetQuestion(trimmedMessage) && !isHowToQuestion(trimmedMessage)) {
            if (StringUtils.hasText(targetHint) && isTargetScreenDifferent(context, targetHint) && !externalFetchOk) {
                return new ChatbotResult(buildMissingDataResponse(targetHint), "");
            }
            if (isBudgetExistenceQuestion(trimmedMessage) || isBudgetCountQuestion(trimmedMessage)
                    || wantsBudgetNames(trimmedMessage)) {
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

        if (autoTool == null && isBudgetQuestion(trimmedMessage) && !isHowToQuestion(trimmedMessage)
                && !hasBudgetData(context)) {
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
            String screenLabel = resolveScreenLabel(context);
            String route = extractRoute(context);
            if (StringUtils.hasText(screenLabel)) {
                promptMessage = "Pantalla actual: " + screenLabel + ".\n" + promptMessage;
            }
            if (StringUtils.hasText(route)) {
                promptMessage = "Ruta actual: " + route + ".\n" + promptMessage;
            }
            if (StringUtils.hasText(targetHint)) {
                promptMessage = "Pantalla solicitada: " + targetHint + ".\n" + promptMessage;
            }
        }

        if (isInterpretationRequest(trimmedMessage)) {
            promptMessage = buildInterpretationPrompt(promptMessage, context);
        }
        boolean includeManual = forceManual || shouldAttachManual(promptMessage);

        VertexResponse first = callVertex(resolvedModule, promptMessage, context, history, includeManual);
        List<ToolCall> toolCalls = parseToolCalls(first.raw());
        if (toolCalls.isEmpty()) {
            toolCalls = parseToolCalls(first.cleaned());
        }
        if (forceManual && isLocationQuestion(trimmedMessage)
                && (looksLikeManualLeak(first.cleaned()) || isUnanswerableResponse(first.cleaned()))) {
            return new ChatbotResult(buildLocationResponse(resolvedModule, context), first.raw());
        }
        if (!toolCalls.isEmpty()) {
            if (toolCalls.size() == 1) {
                ToolCall toolCall = toolCalls.get(0);
                ToolExecution execution = executeTool(toolCall.name(), toolCall.params(), userSub, authorization);
                if (!execution.ok() && "missing_params".equals(execution.error())) {
                    return new ChatbotResult(buildMissingParamsResponse(execution), first.raw());
                }
                if (!execution.ok()) {
                    return new ChatbotResult(ChatbotPolicy.NO_DATA_RESPONSE, first.raw());
                }
                String toolPromptMessage = buildToolFollowupMessage(promptMessage, execution);
                VertexResponse second = callVertex(resolvedModule, toolPromptMessage, context, history, includeManual);
                List<ToolCall> secondCalls = parseToolCalls(second.raw());
                if (secondCalls.isEmpty()) {
                    secondCalls = parseToolCalls(second.cleaned());
                }
                if (!secondCalls.isEmpty()) {
                    return new ChatbotResult(ChatbotPolicy.NO_DATA_RESPONSE, second.raw());
                }
                if (containsToolCall(second.cleaned())) {
                    return new ChatbotResult(ChatbotPolicy.NO_DATA_RESPONSE, second.raw());
                }
                return new ChatbotResult(second.cleaned(), second.raw());
            }
            List<ToolExecution> executions = toolCalls.stream()
                    .map(call -> executeTool(call.name(), call.params(), userSub, authorization))
                    .collect(Collectors.toList());
            ToolExecution missing = executions.stream()
                    .filter(exec -> !exec.ok() && "missing_params".equals(exec.error()))
                    .findFirst()
                    .orElse(null);
            if (missing != null) {
                return new ChatbotResult(buildMissingParamsResponse(missing), first.raw());
            }
            boolean anyError = executions.stream().anyMatch(exec -> !exec.ok());
            if (anyError) {
                return new ChatbotResult(ChatbotPolicy.NO_DATA_RESPONSE, first.raw());
            }
            String toolPromptMessage = buildMultiToolFollowupMessage(promptMessage, executions);
            VertexResponse second = callVertex(resolvedModule, toolPromptMessage, context, history, includeManual);
            List<ToolCall> secondCalls = parseToolCalls(second.raw());
            if (secondCalls.isEmpty()) {
                secondCalls = parseToolCalls(second.cleaned());
            }
            if (!secondCalls.isEmpty()) {
                return new ChatbotResult(ChatbotPolicy.NO_DATA_RESPONSE, second.raw());
            }
            if (containsToolCall(second.cleaned())) {
                return new ChatbotResult(ChatbotPolicy.NO_DATA_RESPONSE, second.raw());
            }
            return new ChatbotResult(second.cleaned(), second.raw());
        }
        if (containsToolCall(first.cleaned())) {
            return new ChatbotResult(ChatbotPolicy.NO_DATA_RESPONSE, first.raw());
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

    private VertexResponse callVertex(String module, String promptMessage, Map<String, Object> context,
            List<Map<String, String>> history, boolean includeManual) {
        String prompt = buildPrompt(module, promptMessage, context, history);
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
            log.error("Vertex AI respondio con error HTTP {}: {}", ex.getStatusCode().value(),
                    ex.getResponseBodyAsString());
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
            // Manual Integral (Markdown as Text)
            if (cachedManualIntegral == null) {
                cachedManualIntegral = loadTextContent(MANUAL_INTEGRAL_MD_CLASSPATH);
            }
            if (StringUtils.hasText(cachedManualIntegral)) {
                parts.add(buildTextPart("MANUAL DE USUARIO INTEGRAL:\n" + cachedManualIntegral));
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

    private Map<String, Object> buildTextPart(String text) {
        Map<String, Object> textPart = new LinkedHashMap<>();
        textPart.put("text", text);
        return textPart;
    }

    private String loadTextContent(String classpath) {
        try {
            ClassPathResource resource = new ClassPathResource(classpath);
            if (!resource.exists()) {
                log.warn("No se encontro el archivo de texto en classpath: {}", classpath);
                return null;
            }
            return new String(resource.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        } catch (IOException ex) {
            log.error("Error leyendo archivo de texto desde classpath: {}", classpath, ex);
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

    private String buildPrompt(String module, String message, Map<String, Object> context,
            List<Map<String, String>> history) {
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

        String todayHint = "Fecha actual del sistema: " + LocalDate.now(ZoneId.systemDefault()) + " ("
                + LocalDate.now(ZoneId.systemDefault()).getDayOfWeek() + ")";

        StringBuilder historyBlock = new StringBuilder();
        if (history != null && !history.isEmpty()) {
            historyBlock.append("\nHistorial reciente de la conversacion:\n");
            for (Map<String, String> msg : history) {
                String role = msg.getOrDefault("sender", "user");
                String text = msg.getOrDefault("text", "");
                historyBlock.append(role.toUpperCase()).append(": ").append(text).append("\n");
            }
        }

        return String.join(
                "\n",
                "Contexto del sistema:",
                todayHint,
                moduleHint,
                contextBlock,
                historyBlock.toString(),
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
                .filter(line -> !isManualLeakLine(line))
                .collect(Collectors.toList());

        return String.join("\n", lines);
    }

    private boolean isManualLeakLine(String line) {
        if (!StringUtils.hasText(line)) {
            return false;
        }
        if (MANUAL_REFERENCE_PATTERN.matcher(line).find()) {
            return true;
        }
        String normalized = normalizeKey(line);
        return normalized.contains("documento")
                && (normalized.contains("funcionalidad") || normalized.contains("usuario")
                        || normalized.contains("manual"));
    }

    private boolean containsToolCall(String text) {
        if (!StringUtils.hasText(text)) {
            return false;
        }
        return TOOL_CALL_PATTERN.matcher(text).find() || TOOL_CALL_LOOSE_PATTERN.matcher(text).find();
    }

    private boolean isUnanswerableResponse(String response) {
        if (!StringUtils.hasText(response)) {
            return true;
        }
        String trimmed = response.trim();
        if (trimmed.equals(ChatbotPolicy.OUT_OF_SCOPE_RESPONSE)
                || trimmed.equals(ChatbotPolicy.NO_DATA_RESPONSE)
                || trimmed.equals(ChatbotPolicy.NO_BUDGETS_RESPONSE)
                || trimmed.equals(ChatbotPolicy.NO_PROFILE_RESPONSE)) {
            return false;
        }
        return UNKNOWN_RESPONSE_PATTERN.matcher(trimmed).find();
    }

    private boolean looksLikeManualLeak(String response) {
        if (!StringUtils.hasText(response)) {
            return false;
        }
        String normalized = normalizeKey(response);
        if (MANUAL_REFERENCE_PATTERN.matcher(response).find()) {
            return true;
        }
        return normalized.contains("documento")
                && (normalized.contains("funcionalidad") || normalized.contains("usuario")
                        || normalized.contains("manual"));
    }

    private boolean hasToolData(ToolExecution execution) {
        if (execution == null || !execution.ok()) {
            return false;
        }
        return hasMeaningfulData(execution.data());
    }

    private boolean hasMeaningfulData(Object value) {
        if (value == null) {
            return false;
        }
        if (value instanceof Map<?, ?> map) {
            if (map.isEmpty()) {
                return false;
            }
            for (Object entryValue : map.values()) {
                if (hasMeaningfulData(entryValue)) {
                    return true;
                }
            }
            return false;
        }
        if (value instanceof java.util.Collection<?> collection) {
            return !collection.isEmpty();
        }
        if (value instanceof String text) {
            return StringUtils.hasText(text);
        }
        return true;
    }

    private List<ToolCall> parseToolCalls(String text) {
        if (!StringUtils.hasText(text)) {
            return List.of();
        }
        String raw = stripCodeFences(text);
        List<ToolCall> calls = new java.util.ArrayList<>();
        Matcher matcher = TOOL_CALL_PATTERN.matcher(raw);
        while (matcher.find()) {
            String name = normalizeToolName(matcher.group(1));
            String json = matcher.group(2);
            calls.add(new ToolCall(name, parseToolParams(json)));
        }
        if (!calls.isEmpty()) {
            return calls;
        }
        Matcher loose = TOOL_CALL_LOOSE_PATTERN.matcher(raw);
        while (loose.find()) {
            String name = normalizeToolName(loose.group(1));
            String json = loose.group(2);
            calls.add(new ToolCall(name, parseToolParams(json)));
        }
        return calls;
    }

    private static String normalizeToolName(String value) {
        if (!StringUtils.hasText(value)) {
            return value;
        }
        String upper = value.trim().toUpperCase();
        if (upper.contains("_")) {
            return upper;
        }
        String compact = upper.replaceAll("[^A-Z]", "");
        return switch (compact) {
            case "GETBALANCE" -> "GET_BALANCE";
            case "SEARCHMOVEMENTS" -> "SEARCH_MOVEMENTS";
            case "GETPENDINGTASKS" -> "GET_PENDING_TASKS";
            case "GETSCREENDATA" -> "GET_SCREEN_DATA";
            default -> upper;
        };
    }

    private Map<String, Object> parseToolParams(String json) {
        if (!StringUtils.hasText(json)) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json,
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                    });
        } catch (Exception ex) {
            log.warn("No se pudo parsear parametros de tool call: {}", json);
            return Map.of();
        }
    }

    private ToolExecution executeTool(String toolName, Map<String, Object> params, String userSub,
            String authorization) {
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
                "Si ok es true, responde solo a lo preguntado y no menciones faltantes.",
                "IMPORTANTE: Se conciso pero responde lo preguntado. Si hay muchos meses, prioriza resumir los meses con mas actividad para evitar que se corte la respuesta.",
                "Podes listar los meses principales y preguntar si quiere ver el resto.",
                "IMPORTANTE: Si el usuario pide 'otro' o 'más', verifica el historial de mensajes.",
                "Identifica qué elementos ya mencionaste y elige UN ELEMENTO DISTINTO de los resultados de la herramienta.",
                "IMPORTANTE: Siempre que menciones que puede ir a una sección, usa EXACTAMENTE el formato [[/ruta|Nombre de Sección]]. No dejes el nombre vacío.",
                "Responde solo con estos datos reales.");
    }

    private String buildMultiToolFollowupMessage(String promptMessage, List<ToolExecution> executions) {
        String base = StringUtils.hasText(promptMessage) ? promptMessage.trim() : "Consulta del usuario.";
        String results = executions.stream()
                .map(execution -> "Resultado herramienta " + execution.tool() + ": "
                        + safeWriteJson(execution.toPayload()))
                .collect(Collectors.joining("\n"));
        return String.join(
                "\n",
                base,
                results,
                "Responde solo a lo preguntado y no menciones faltantes.",
                "Responde solo con estos datos reales.");
    }

    private ToolExecution maybeAutoTool(String message, Map<String, Object> context, List<Map<String, String>> history,
            String userSub, String authorization) {
        if (!StringUtils.hasText(userSub)) {
            return null;
        }
        String lower = normalizeKey(message);
        Map<String, Object> params = buildAutoToolParams(message, context);

        // Escaneo agresivo del historial para mantener el hilo del tema (facturas vs
        // movimientos vs presupuestos)
        if (matchesAny(lower, "otro", "otra", "mas", "más", "siguiente", "otor", "otoro") && history != null
                && !history.isEmpty()) {
            for (int i = history.size() - 1; i >= 0; i--) {
                Map<String, String> entry = history.get(i);
                if ("user".equalsIgnoreCase(entry.get("sender"))) {
                    String prevMsg = normalizeKey(entry.get("text"));
                    if (prevMsg != null
                            && !matchesAny(prevMsg, "otro", "otra", "mas", "más", "siguiente", "otor", "otoro")) {
                        if (isConciliationQuery(prevMsg)) {
                            params.put("screen", "conciliacion");
                            if (prevMsg.contains("conciliado")) {
                                params.put("status", "conciliados");
                            } else if (prevMsg.contains("sin conciliar") || prevMsg.contains("pendiente")) {
                                params.put("status", "sin-conciliar");
                            }
                            // Heredar filtros temporales
                            if (!params.containsKey("anio")) {
                                Integer hYear = extractYearFromMessage(prevMsg);
                                if (hYear != null)
                                    params.put("anio", hYear);
                            }
                            if (!params.containsKey("mes")) {
                                Integer hMonth = extractMonthFromMessage(prevMsg);
                                if (hMonth != null)
                                    params.put("mes", hMonth);
                            }
                            break;
                        } else if (matchesAny(prevMsg, "factura", "facturas")) {
                            params.put("screen", "ver-facturas");
                            break;
                        } else if (matchesAny(prevMsg, "presupuesto", "presupuestos")) {
                            params.put("screen", "presupuestos");
                            break;
                        } else if (matchesAny(prevMsg, "movimiento", "movimientos", "ingreso", "egreso")) {
                            params.put("screen", "ver-movimientos");
                            break;
                        }
                    }
                }
            }
        }

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
        String screenKey = stringValue(params.get("screen"));
        boolean hasRange = params != null && (params.containsKey("fechaDesde") || params.containsKey("fechaHasta"));
        if (hasRange && matchesAny(normalizedMessage, "ingreso", "ingresos", "egreso", "egresos", "movimiento",
                "movimientos", "movimento", "movimentos")) {
            return ToolName.SEARCH_MOVEMENTS;
        }
        if (matchesAny(normalizedMessage, "saldo", "balance", "saldo total", "plata", "dinero", "efectivo")
                || (normalizedMessage.contains("caja") && !normalizedMessage.contains("flujo"))) {
            return ToolName.GET_BALANCE;
        }
        if (matchesAny(normalizedMessage, "factura", "facturas")) {
            params.put("screen", "ver-facturas");
            return ToolName.GET_SCREEN_DATA;
        }
        if (matchesAny(normalizedMessage, "movimiento", "movimientos", "movimento", "movimentos", "ingreso", "egreso",
                "otro", "otra", "mas", "más", "siguiente", "otor", "otoro")) {
            if (isConciliationQuery(normalizedMessage) || "conciliacion".equals(screenKey)) {
                params.put("screen", "conciliacion");
                return ToolName.GET_SCREEN_DATA;
            }
            if (matchesAny(normalizedMessage, "otro", "otra", "mas", "más", "siguiente", "otor", "otoro")) {
                if ("ver-facturas".equals(screenKey)) {
                    return ToolName.GET_SCREEN_DATA;
                }
                if ("presupuestos".equals(screenKey)) {
                    return ToolName.GET_SCREEN_DATA;
                }
            }
            return ToolName.SEARCH_MOVEMENTS;
        }

        if ("conciliacion".equals(screenKey)) {
            if (matchesAny(normalizedMessage, "pendiente", "pendientes") && params.containsKey("fecha")) {
                return ToolName.GET_PENDING_TASKS;
            }
            return ToolName.GET_SCREEN_DATA;
        }

        boolean isReminderQuery = matchesAny(normalizedMessage, "recordatorio", "recordatorios", "notificacion",
                "notificaciones");
        if (!isReminderQuery
                && matchesAny(normalizedMessage, "conciliacion", "conciliar", "pendiente", "pendientes",
                        "sin conciliar")) {
            return ToolName.GET_PENDING_TASKS;
        }
        if (StringUtils.hasText(screenKey)) {
            return ToolName.GET_SCREEN_DATA;
        }
        return null;
    }

    private Map<String, Object> buildAutoToolParams(String message, Map<String, Object> context) {
        Map<String, Object> params = new LinkedHashMap<>();
        String normalized = normalizeKey(message);
        String screenKey = resolveTargetScreenKey(message);
        if (isConciliationQuery(message)) {
            screenKey = "conciliacion";
            if (normalized.contains("conciliado")) {
                params.put("status", "conciliados");
            } else if (normalized.contains("sin conciliar") || normalized.contains("pendiente")) {
                params.put("status", "sin-conciliar");
            } else {
                // Si no especifica, por defecto sin-conciliar para que GET_PENDING_TASKS no
                // rompa
                params.put("status", "sin-conciliar");
            }
        }
        if (isDueDateQuery(message)) {
            screenKey = "ver-facturas";
        }
        if (!StringUtils.hasText(screenKey)) {
            screenKey = resolveCurrentScreenKey(context);
        }
        if (StringUtils.hasText(screenKey)) {
            params.put("screen", screenKey);
        }
        Integer year = extractYearFromMessage(message);
        Integer month = extractMonthFromMessage(message);
        // Fallback: Si no hay año pero la pantalla lo requiere, usamos el actual
        if (year == null && matchesAny(screenKey, "flujo-de-caja", "estado-de-resultados", "reporte-mensual")) {
            year = LocalDate.now(ZoneId.systemDefault()).getYear();
        }
        if (year != null)
            params.put("anio", year);
        if (month != null)
            params.put("mes", month);
        DateRange range = resolveTemporalRange(message);
        if (range != null) {
            params.put("fechaDesde", range.from());
            params.put("fechaHasta", range.to());
            if ((isConciliationQuery(message)
                    || ("conciliacion".equals(screenKey) && matchesAny(normalized, "pendiente", "pendientes")))
                    && range.from() != null && range.to() != null
                    && range.from().isEqual(range.to())) {
                params.put("fecha", range.from());
            }
        }
        if (range != null && year == null && "flujo-de-caja".equals(screenKey)) {
            params.put("anio", range.from().getYear());
        }
        if (range != null && year == null && "estado-de-resultados".equals(screenKey)) {
            params.put("anio", range.from().getYear());
        }
        if (matchesAny(normalized, "ingreso", "ingresos") && !matchesAny(normalized, "egreso", "egresos")) {
            params.put("tipo", "Ingreso");
        } else if (matchesAny(normalized, "egreso", "egresos") && !matchesAny(normalized, "ingreso", "ingresos")) {
            params.put("tipo", "Egreso");
        }
        String currency = extractCurrencyFromContext(context);
        if (!StringUtils.hasText(currency)) {
            String lowerMsg = message.toLowerCase();
            if (lowerMsg.contains("dolar") || lowerMsg.contains("usd") || lowerMsg.contains("u$s")) {
                currency = "USD";
            } else if (lowerMsg.contains("peso") || lowerMsg.contains("ars") || lowerMsg.contains("$")) {
                currency = "ARS";
            } else {
                currency = "ARS"; // Default a pesos si no hay info
            }
        }
        params.put("moneda", currency);
        Integer userId = extractUserIdFromContext(context);
        if (userId != null)
            params.put("userId", userId);
        return params;
    }

    private boolean isConciliationQuery(String message) {
        if (!StringUtils.hasText(message)) {
            return false;
        }
        String normalized = normalizeKey(message);
        if (matchesAny(normalized, "recordatorio", "recordatorios", "notificacion", "notificaciones")) {
            return false;
        }
        boolean hasConciliation = matchesAny(normalized, "conciliacion", "conciliar", "sin conciliar", "conciliado",
                "conciliados");
        boolean hasPending = matchesAny(normalized, "pendiente", "pendientes");
        boolean hasPayment = matchesAny(normalized, "pago", "pagos", "cobro", "cobros", "factura", "facturas",
                "movimiento", "movimientos");
        return hasConciliation || (hasPending && hasPayment);
    }

    private boolean isDueDateQuery(String message) {
        if (!StringUtils.hasText(message)) {
            return false;
        }
        String normalized = normalizeKey(message);
        if (!normalized.contains("venc")) {
            return false;
        }
        return matchesAny(normalized, "factura", "facturas", "pago", "pagos", "cobro", "cobros");
    }

    private DateRange resolveTemporalRange(String message) {
        if (!StringUtils.hasText(message)) {
            return null;
        }
        String normalized = normalizeKey(message);
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        if (matchesAny(normalized, "hoy", "ahora", "en este momento", "en este instante", "actualmente", "reciente",
                "recientes")) {
            return new DateRange(today, today);
        }
        if (normalized.contains("esta semana")) {
            LocalDate start = today.with(java.time.DayOfWeek.MONDAY);
            LocalDate end = today.with(java.time.DayOfWeek.SUNDAY);
            return new DateRange(start, end);
        }
        if (normalized.contains("este mes")) {
            LocalDate start = today.withDayOfMonth(1);
            LocalDate end = today.withDayOfMonth(today.lengthOfMonth());
            return new DateRange(start, end);
        }
        if (matchesAny(normalized, "este ano", "ano actual", "este ejercicio")) {
            LocalDate start = today.withDayOfMonth(1).withMonth(1);
            LocalDate end = today.withMonth(12).withDayOfMonth(31);
            return new DateRange(start, end);
        }
        return null;
    }

    private boolean isAmbiguousTemporal(String message) {
        if (!StringUtils.hasText(message)) {
            return false;
        }
        if (AMBIGUOUS_TEMPORAL_PATTERN.matcher(message.trim()).matches()) {
            return true;
        }
        String normalized = normalizeKey(message);
        if (matchesAny(normalized, "lo de hoy", "lo de ahora", "lo de este momento")) {
            return true;
        }
        if (TEMPORAL_WORD_PATTERN.matcher(normalized).find()
                && !isDataRequest(message)
                && !EXPLICIT_DATE_TIME_PATTERN.matcher(normalized).find()) {
            return true;
        }
        return false;
    }

    private boolean needsPeriodClarification(String message) {
        if (!StringUtils.hasText(message)) {
            return false;
        }
        String normalized = normalizeKey(message);
        if (matchesAny(normalized, "ultimo mes", "mes pasado", "trimestre pasado", "semana pasada",
                "ano pasado", "anio pasado", "ultimo trimestre", "ultima semana")) {
            return true;
        }
        if (normalized.contains("trimestre")) {
            return true;
        }
        if (normalized.contains("mes") && !normalized.contains("este mes")) {
            Integer month = extractMonthFromMessage(message);
            Integer year = extractYearFromMessage(message);
            return month == null && year == null;
        }
        return false;
    }

    private boolean hasMultipleDataIntents(String message) {
        if (!StringUtils.hasText(message)) {
            return false;
        }
        String normalized = normalizeKey(message);
        boolean hasConjunction = normalized.contains(" y ")
                || normalized.contains("ademas")
                || normalized.contains("tambien")
                || normalized.contains("junto con");
        if (!hasConjunction) {
            return false;
        }
        boolean hasCashflow = matchesAny(normalized, "flujo de caja", "cashflow", "cash flow");
        boolean hasBalance = matchesAny(normalized, "saldo", "balance", "caja", "plata", "dinero", "efectivo");
        boolean hasMovements = matchesAny(normalized, "movimiento", "movimientos");
        boolean hasBudgets = matchesAny(normalized, "presupuesto", "presupuestos");
        boolean hasInvoices = matchesAny(normalized, "factura", "facturas");
        boolean hasConciliation = isConciliationQuery(message);
        boolean hasReport = matchesAny(normalized, "ingreso", "ingresos", "egreso", "egresos",
                "reporte", "estado de resultados", "resultado", "pyl", "p&l");
        int intents = 0;
        if (hasCashflow) {
            intents++;
        } else if (hasBalance) {
            intents++;
        }
        if (hasConciliation) {
            intents++;
        } else if (hasMovements) {
            intents++;
        }
        if (hasBudgets)
            intents++;
        if (hasInvoices)
            intents++;
        if (!hasCashflow && hasReport)
            intents++;
        return intents >= 2;
    }

    private String resolveMissingDataHintForMessage(String message) {
        if (!StringUtils.hasText(message)) {
            return null;
        }
        String normalized = normalizeKey(message);
        if (matchesAny(normalized, "movimiento", "movimientos")) {
            return "Registro > Movimientos";
        }
        if (isDueDateQuery(message) || matchesAny(normalized, "factura", "facturas")) {
            return "Registro > Facturas";
        }
        if (isConciliationQuery(message)
                || matchesAny(normalized, "conciliacion", "conciliar", "pendiente", "pendientes")) {
            return "Conciliacion";
        }
        if (matchesAny(normalized, "presupuesto", "presupuestos")) {
            return "Pronostico > Presupuestos";
        }
        if (matchesAny(normalized, "pronostico continuo", "pronostico continuo", "rolling")) {
            return "Pronostico > Pronostico continuo";
        }
        if (matchesAny(normalized, "pronostico fijo")) {
            return "Pronostico > Pronostico fijo";
        }
        if (matchesAny(normalized, "recordatorio", "recordatorios")) {
            return "Notificaciones > Recordatorios";
        }
        if (matchesAny(normalized, "notificacion", "notificaciones", "alerta", "alertas")) {
            return "Notificaciones > Centro de notificaciones";
        }
        if (matchesAny(normalized, "flujo de caja")) {
            return "Reportes > Flujo de caja";
        }
        if (matchesAny(normalized, "estado de resultados", "estado de resultado", "resultado")) {
            return "Reportes > Estado de resultados";
        }
        if (matchesAny(normalized, "reporte", "ingreso", "egreso")) {
            return "Reporte mensual";
        }
        return null;
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
        if (matchesAny(lower, "ingreso", "ingresos", "egreso", "egresos", "resultado mensual")) {
            return "reporte-mensual";
        }
        if (matchesAny(lower, "flujo de caja", "cashflow", "cash flow")) {
            return "flujo-de-caja";
        }
        if (matchesAny(lower, "estado de resultados", "estado de resultado", "resultado del ano",
                "resultado del a\u00f1o", "resultado anual", "resultado", "p l", "p&l", "pyl")) {
            return "estado-de-resultados";
        }
        if (matchesAny(lower, "pronostico fijo", "pronóstico fijo")) {
            return "pronostico-fijo";
        }
        if (matchesAny(lower, "pronostico continuo", "pronóstico continuo", "rolling")) {
            return "pronostico-continuo";
        }
        if (matchesAny(lower, "presupuesto", "presupuestos")) {
            return "presupuestos";
        }
        if (matchesAny(lower, "ver movimientos", "movimientos cargados", "movimientos", "movimiento")) {
            return "ver-movimientos";
        }
        if (matchesAny(lower, "ver facturas", "facturas", "factura")) {
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
        if (matchesAny(lower, "recordatorios", "recordatorio")) {
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
        if (normalized.contains("enero"))
            return 1;
        if (normalized.contains("febrero"))
            return 2;
        if (normalized.contains("marzo"))
            return 3;
        if (normalized.contains("abril"))
            return 4;
        if (normalized.contains("mayo"))
            return 5;
        if (normalized.contains("junio"))
            return 6;
        if (normalized.contains("julio"))
            return 7;
        if (normalized.contains("agosto"))
            return 8;
        if (normalized.contains("septiembre") || normalized.contains("setiembre"))
            return 9;
        if (normalized.contains("octubre"))
            return 10;
        if (normalized.contains("noviembre"))
            return 11;
        if (normalized.contains("diciembre"))
            return 12;
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
                    "Decime esos datos y vuelvo a intentarlo.");
        }
        return ChatbotPolicy.NO_DATA_RESPONSE;
    }

    private String buildHowToOverride(String message) {
        if (!StringUtils.hasText(message)) {
            return null;
        }
        String normalized = normalizeKey(message);
        if (matchesAny(normalized, "cargar ingreso", "carga de ingreso", "registrar ingreso")) {
            return String.join(
                    "\n",
                    "Entra a Carga de datos > Ingresos.",
                    "Elegi el metodo (formulario, documento, foto o audio), completa los campos y guarda.");
        }
        if (matchesAny(normalized, "cargar egreso", "carga de egreso", "registrar egreso")) {
            return String.join(
                    "\n",
                    "Entra a Carga de datos > Egresos.",
                    "Elegi el metodo (formulario, documento, foto o audio), completa los campos y guarda.");
        }
        if (matchesAny(normalized, "cargar factura", "carga de factura", "registrar factura")) {
            return String.join(
                    "\n",
                    "Entra a Carga de datos > Facturas.",
                    "Elegi el metodo (formulario, documento, foto o audio), completa los datos y guarda.");
        }
        return null;
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
        String trimmed = message.trim();
        if (AMBIGUOUS_TEMPORAL_PATTERN.matcher(trimmed).matches()) {
            return false;
        }
        if (DATE_ONLY_PATTERN.matcher(trimmed).matches()) {
            return true;
        }
        if (isDataRequest(message) || isHowToQuestion(message) || isInterpretationRequest(message)) {
            return false;
        }
        if (EXPLICIT_DATE_TIME_PATTERN.matcher(trimmed).find()) {
            return true;
        }
        String normalized = normalizeKey(message);
        if (StringUtils.hasText(normalized)) {
            if (matchesAny(normalized,
                    "que fecha es", "que dia es", "que hora es",
                    "en que fecha estamos", "en que dia estamos",
                    "fecha actual", "fecha de hoy", "dia de hoy", "hora actual")) {
                return true;
            }
            if (DATE_QUESTION_PATTERN.matcher(normalized).find()) {
                return true;
            }
        }
        return false;
    }

    private boolean isDataRequest(String message) {
        if (message == null) {
            return false;
        }
        if (DATA_REQUEST_PATTERN.matcher(message).find()) {
            return true;
        }
        String normalized = normalizeKey(message);
        return StringUtils.hasText(normalized) && DATA_REQUEST_PATTERN.matcher(normalized).find();
    }

    private boolean hasPermission(Map<String, Object> context, String modulo, String accion) {
        if (context == null)
            return false;

        Object permisosObj = context.get("permisos");
        if (permisosObj == null)
            return false;

        // Caso standard: Map (LinkedHashMap)
        if (permisosObj instanceof Map) {
            Map<?, ?> permisos = (Map<?, ?>) permisosObj;
            Object moduloObj = permisos.get(modulo);
            if (moduloObj instanceof Map) {
                Map<?, ?> moduloMap = (Map<?, ?>) moduloObj;
                Object valor = moduloMap.get(accion);
                return isValueTrue(valor);
            }
        }

        // Caso fallback: Si Jackson devolvio un JsonNode
        if (permisosObj instanceof JsonNode) {
            JsonNode permisosJson = (JsonNode) permisosObj;
            JsonNode moduloJson = permisosJson.get(modulo);
            if (moduloJson != null && moduloJson.isObject()) {
                JsonNode actionJson = moduloJson.get(accion);
                if (actionJson != null) {
                    return actionJson.asBoolean() || "true".equalsIgnoreCase(actionJson.asText());
                }
            }
        }

        return false;
    }

    private boolean isValueTrue(Object valor) {
        if (valor == null)
            return false;
        if (valor instanceof Boolean)
            return (Boolean) valor;
        if (valor instanceof String)
            return "true".equalsIgnoreCase((String) valor);
        if (valor instanceof Number)
            return ((Number) valor).intValue() == 1;
        return false;
    }

    @SuppressWarnings("unchecked")
    private void enrichContext(Map<String, Object> context) {
        if (context == null)
            return;

        // Forzamos permiso de notificaciones a true ya que es un modulo global
        Object permisosObj = context.get("permisos");

        // Caso Map (LinkedHashMap)
        if (permisosObj instanceof Map) {
            Map<String, Object> permisos = (Map<String, Object>) permisosObj;
            Map<String, Object> notif = (Map<String, Object>) permisos.get("notif");
            if (notif == null) {
                notif = new LinkedHashMap<>();
                permisos.put("notif", notif);
            }
            notif.put("view", true);
        }

        // Caso JsonNode (Si Jackson inyecta un ObjectNode)
        if (permisosObj instanceof com.fasterxml.jackson.databind.node.ObjectNode) {
            com.fasterxml.jackson.databind.node.ObjectNode permisosJson = (com.fasterxml.jackson.databind.node.ObjectNode) permisosObj;
            com.fasterxml.jackson.databind.node.ObjectNode notif = (com.fasterxml.jackson.databind.node.ObjectNode) permisosJson
                    .get("notif");
            if (notif == null) {
                notif = permisosJson.putObject("notif");
            }
            notif.put("view", true);
        } else if (permisosObj instanceof com.fasterxml.jackson.databind.JsonNode) {
            // Caso generico JsonNode no mutable (intentamos recrear)
            log.warn("Permisos detectados como JsonNode no mutable, procediendo con mapeo manual.");
        }
    }

    private boolean isModuleAuthorized(String message, Map<String, Object> context) {
        if (!isDataRequest(message)) {
            return true;
        }
        String normalized = normalizeKey(message);

        // Mapeo exhaustivo de palabras clave a permisos
        if (normalized.contains("presupuesto")) {
            return hasPermission(context, "pres", "view");
        }
        if (normalized.contains("notificacion") || normalized.contains("recordatorio")) {
            return true; // Acceso general para todos los usuarios
        }
        if (matchesAny(normalized, "pronostico", "pronosticos", "forecast")) {
            return hasPermission(context, "pron", "view");
        }
        if (matchesAny(normalized, "factura", "facturas")) {
            return hasPermission(context, "facts", "view");
        }
        if (normalized.contains("concilia") || normalized.contains("conciliado")) {
            return hasPermission(context, "concil", "view");
        }
        if (matchesAny(normalized, "movimiento", "movimientos", "ingreso", "egreso")) {
            return hasPermission(context, "movs", "view");
        }
        if (matchesAny(normalized, "cashflow", "pyl", "resultado", "reporte")) {
            return hasPermission(context, "reps", "view");
        }
        if (matchesAny(normalized, "dashboard", "tablero", "saldo", "balance", "caja", "plata", "dinero", "efectivo")) {
            return hasPermission(context, "dashboard", "view") || hasPermission(context, "reps", "view");
        }
        if (matchesAny(normalized, "usuario", "usuarios", "roles", "organizacion", "organizaci")) {
            return hasPermission(context, "admin", "view");
        }

        return true;
    }

    private boolean isHowToQuestion(String message) {
        if (message == null) {
            return false;
        }
        if (HOW_TO_PATTERN.matcher(message).find()) {
            return true;
        }
        String normalized = normalizeKey(message);
        return StringUtils.hasText(normalized) && HOW_TO_PATTERN.matcher(normalized).find();
    }

    private boolean isBudgetQuestion(String message) {
        if (message == null) {
            return false;
        }
        return BUDGET_PATTERN.matcher(message).find();
    }

    private boolean isPronosticoQuestion(String message) {
        if (message == null) {
            return false;
        }
        return PRONOSTICO_PATTERN.matcher(message).find();
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
            List<String> names = info.names.stream().filter(StringUtils::hasText).distinct()
                    .collect(Collectors.toList());
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
                "No menciones el manual ni PDF.");
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
                "Pregunta original: " + message);
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
                    "octubre", "noviembre", "diciembre" ->
                true;
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
        if (matchesAny(lower, "movimientos bancarios", "movimiento bancario", "movimientos", "movimiento",
                "extracto")) {
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
        if (matchesAny(lower, "pronostico fijo", "pronóstico fijo")) {
            return "Pronostico > Pronostico fijo";
        }
        if (matchesAny(lower, "pronostico continuo", "pronóstico continuo", "rolling forecast")) {
            return "Pronostico > Pronostico continuo";
        }
        if (matchesAny(lower, "presupuesto", "presupuestos")) {
            return "Pronostico > Presupuestos";
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
        if (matchesAny(lower, "configuracion de notificaciones", "configurar notificaciones",
                "preferencias de notificaciones")) {
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
        String normalized = java.text.Normalizer.normalize(value.toLowerCase(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        normalized = normalized.replaceAll("[^a-z0-9 ]", " ").trim();
        return normalized.replaceAll("\\s+", " ");
    }

    private String buildMissingDataResponse(String targetHint) {
        String hint = StringUtils.hasText(targetHint) ? targetHint.trim() : "esa pantalla";
        return String.join(
                "\n",
                "Para responder necesito los datos reales de " + hint + ".",
                "Abrila y volve a hacer la consulta.");
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
                        "Decime esos datos o abrila y volve a hacer la consulta.");
            }
            return String.join(
                    "\n",
                    "Para responder necesito datos reales de " + target + ".",
                    "Abrila y volve a hacer la consulta.");
        }
        if ("failed".equals(info.status) || "unsupported".equals(info.status)) {
            return String.join(
                    "\n",
                    "No pude obtener los datos reales de " + target + " desde esta pantalla.",
                    "Abrila y volve a hacer la consulta.");
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
            case "anio", "aÃ±o", "year" -> "el a\u00f1o";
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
                return ToolName.valueOf(normalizeToolName(value));
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
    }

    private record ToolCall(String name, Map<String, Object> params) {
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }

    private record ToolExecution(String tool, boolean ok, Map<String, Object> data, String error,
            List<String> missing) {
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
