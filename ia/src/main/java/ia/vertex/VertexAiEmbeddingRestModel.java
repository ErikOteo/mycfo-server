package ia.vertex;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class VertexAiEmbeddingRestModel implements EmbeddingModel {

    private static final String CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

    private final String projectId;
    private final String location;
    private final String modelName;
    private final GoogleCredentials credentials;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public VertexAiEmbeddingRestModel(String projectId,
                                      String location,
                                      String modelName,
                                      GoogleCredentials credentials,
                                      ObjectMapper objectMapper) {
        this.projectId = projectId;
        this.location = location;
        this.modelName = modelName;
        this.credentials = credentials;
        this.objectMapper = objectMapper;
    }

    @Override
    public Response<List<Embedding>> embedAll(List<TextSegment> segments) {
        if (segments == null || segments.isEmpty()) {
            return Response.from(List.of());
        }
        List<Embedding> embeddings = new ArrayList<>(segments.size());
        for (TextSegment segment : segments) {
            embeddings.add(embedSingle(segment));
        }
        return Response.from(embeddings);
    }

    private Embedding embedSingle(TextSegment segment) {
        String endpoint = String.format(
                "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:predict",
                location,
                projectId,
                location,
                modelName
        );

        try {
            String token = resolveAccessToken();
            Map<String, Object> instance = new LinkedHashMap<>();
            instance.put("content", segment.text());

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("instances", List.of(instance));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            String payload = objectMapper.writeValueAsString(body);
            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    new HttpEntity<>(payload, headers),
                    String.class
            );

            return Embedding.from(extractVector(response.getBody()));
        } catch (RestClientResponseException ex) {
            throw new IllegalStateException("Error HTTP al consultar Vertex AI embeddings: " + ex.getRawStatusCode());
        } catch (Exception ex) {
            throw new IllegalStateException("Error al consultar Vertex AI embeddings.", ex);
        }
    }

    private float[] extractVector(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        JsonNode values = root.path("predictions").path(0).path("embeddings").path("values");
        if (!values.isArray()) {
            throw new IllegalStateException("Respuesta de embeddings invalida.");
        }
        float[] vector = new float[values.size()];
        for (int i = 0; i < values.size(); i++) {
            vector[i] = (float) values.get(i).asDouble();
        }
        return vector;
    }

    private String resolveAccessToken() throws Exception {
        GoogleCredentials scoped = credentials.createScoped(List.of(CLOUD_SCOPE));
        AccessToken token = scoped.getAccessToken();
        if (token == null || token.getExpirationTime() == null ||
                token.getExpirationTime().before(Date.from(Instant.now()))) {
            token = scoped.refreshAccessToken();
        }
        if (token == null) {
            throw new IllegalStateException("No se pudo obtener access token de Google.");
        }
        return token.getTokenValue();
    }
}
