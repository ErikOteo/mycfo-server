package ia.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import ia.config.VertexAiProperties;
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

import java.io.FileInputStream;
import java.time.Instant;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotVertexService {

    private static final String CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
    private static final Pattern FENCE_PATTERN = Pattern.compile("```[a-zA-Z]*");

    private final VertexAiProperties properties;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public ChatbotResult chat(String message, String module) {
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
        String prompt = buildPrompt(safeModule, message.trim());
        String endpoint = String.format(
                "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent",
                properties.getLocation(),
                properties.getProjectId(),
                properties.getLocation(),
                properties.getModel()
        );

        String token = resolveAccessToken();
        Map<String, Object> requestBody = buildRequestBody(prompt);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            String payload = objectMapper.writeValueAsString(requestBody);
            log.info("Enviando mensaje a Vertex AI. Modulo: {}, Endpoint: {}", safeModule, endpoint);
            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    new HttpEntity<>(payload, headers),
                    String.class
            );

            String raw = extractTextFromResponse(response.getBody());
            String cleaned = stripCodeFences(raw).trim();
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

    private Map<String, Object> buildRequestBody(String prompt) {
        Map<String, Object> textPart = new LinkedHashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> content = new LinkedHashMap<>();
        content.put("role", "user");
        content.put("parts", List.of(textPart));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", properties.getTemperature());
        generationConfig.put("maxOutputTokens", properties.getMaxOutputTokens());

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
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (textNode.isMissingNode()) {
            return "";
        }
        return textNode.asText("");
    }

    private String buildPrompt(String module, String message) {
        String moduleHint = switch (module.toLowerCase()) {
            case "registro" -> "Estas asistiendo en el modulo Registro: cargas, movimientos, ingresos, egresos, deudas y acreencias.";
            case "reporte" -> "Estas asistiendo en el modulo Reporte: cashflow, P&L, resumenes y analisis.";
            case "pronostico" -> "Estas asistiendo en el modulo Pronostico: presupuestos, proyecciones y escenarios.";
            case "administracion" -> "Estas asistiendo en el modulo Administracion: configuraciones y gestion general.";
            default -> "Estas asistiendo en MyCFO. Responde con foco en el modulo indicado por el usuario.";
        };

        return String.join(
                "\n",
                "Sos el asistente virtual de MyCFO.",
                moduleHint,
                "Responde en espanol, de forma clara, breve y accionable.",
                "Si falta contexto, pedi una aclaracion concreta.",
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

    private String truncate(String value, int maxLen) {
        if (value == null || value.length() <= maxLen) {
            return value;
        }
        return value.substring(0, maxLen) + "...";
    }

    public record ChatbotResult(String responseText, String rawText) {
    }
}

