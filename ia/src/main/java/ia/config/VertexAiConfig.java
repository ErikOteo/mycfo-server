package ia.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vertexai.VertexAI;
import com.google.cloud.vertexai.api.GenerationConfig;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.vertexai.VertexAiGeminiChatModel;
import ia.vertex.VertexAiEmbeddingRestModel;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StringUtils;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;

@Configuration
@RequiredArgsConstructor
public class VertexAiConfig {

    private static final String CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

    private final VertexAiProperties properties;
    private final ObjectMapper objectMapper;

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        GoogleCredentials credentials = resolveCredentials();
        GenerationConfig generationConfig = GenerationConfig.newBuilder()
                .setTemperature((float) properties.getTemperature())
                .setMaxOutputTokens(properties.getMaxOutputTokens())
                .build();
        VertexAI vertexAI = new VertexAI.Builder()
                .setProjectId(requireProjectId())
                .setLocation(requireLocation())
                .setCredentials(credentials)
                .build();
        GenerativeModel generativeModel = new GenerativeModel(requireModel(), vertexAI);
        return new VertexAiGeminiChatModel(generativeModel, generationConfig);
    }

    @Bean
    public EmbeddingModel embeddingModel() {
        GoogleCredentials credentials = resolveCredentials();
        return new VertexAiEmbeddingRestModel(
                requireProjectId(),
                requireLocation(),
                requireEmbeddingModel(),
                credentials,
                objectMapper
        );
    }

    private GoogleCredentials resolveCredentials() {
        try {
            GoogleCredentials credentials;
            String credentialsPath = materializeCredentialsPath();
            if (StringUtils.hasText(credentialsPath)) {
                // Ensure ADC can see the file for clients that rely on default credentials.
                System.setProperty("GOOGLE_APPLICATION_CREDENTIALS", credentialsPath);
                setEnvVar("GOOGLE_APPLICATION_CREDENTIALS", credentialsPath);
                try (FileInputStream stream = new FileInputStream(credentialsPath)) {
                    credentials = GoogleCredentials.fromStream(stream);
                }
            } else {
                credentials = GoogleCredentials.getApplicationDefault();
            }
            return credentials.createScoped(Collections.singleton(CLOUD_SCOPE));
        } catch (IOException ex) {
            throw new IllegalStateException("No se pudieron cargar las credenciales de Vertex AI.", ex);
        }
    }

    private String materializeCredentialsPath() throws IOException {
        String rawPath = properties.getCredentialsPath();
        if (!StringUtils.hasText(rawPath)) {
            rawPath = resolveCredentialsPathFromEnv();
        }
        if (!StringUtils.hasText(rawPath)) {
            return null;
        }
        if (rawPath.startsWith("classpath:")) {
            String resourcePath = rawPath.substring("classpath:".length());
            ClassPathResource resource = new ClassPathResource(resourcePath);
            if (!resource.exists()) {
                throw new IOException("No se encontro el recurso de credenciales: " + rawPath);
            }
            try (InputStream inputStream = resource.getInputStream()) {
                Path tempFile = Files.createTempFile("gcp-credentials-", ".json");
                Files.copy(inputStream, tempFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                tempFile.toFile().deleteOnExit();
                return tempFile.toAbsolutePath().toString();
            }
        }
        Path path = Path.of(rawPath);
        if (!Files.exists(path)) {
            throw new IOException("No se encontro el archivo de credenciales: " + rawPath);
        }
        return path.toAbsolutePath().toString();
    }

    @SuppressWarnings("unchecked")
    private static void setEnvVar(String key, String value) {
        try {
            Class<?> processEnvironment = Class.forName("java.lang.ProcessEnvironment");
            java.lang.reflect.Field theEnvironmentField = processEnvironment.getDeclaredField("theEnvironment");
            theEnvironmentField.setAccessible(true);
            ((java.util.Map<String, String>) theEnvironmentField.get(null)).put(key, value);
            java.lang.reflect.Field ciEnvironmentField = processEnvironment.getDeclaredField("theCaseInsensitiveEnvironment");
            ciEnvironmentField.setAccessible(true);
            ((java.util.Map<String, String>) ciEnvironmentField.get(null)).put(key, value);
            return;
        } catch (Exception ignored) {
            // Fallback for non-Oracle/OpenJDK env map implementations.
        }
        try {
            java.util.Map<String, String> env = System.getenv();
            java.lang.reflect.Field field = env.getClass().getDeclaredField("m");
            field.setAccessible(true);
            ((java.util.Map<String, String>) field.get(env)).put(key, value);
        } catch (Exception ignored) {
            // If we can't mutate env, ADC will rely on System properties.
        }
    }

    private String resolveCredentialsPathFromEnv() {
        String fromEnv = System.getenv("VERTEX_CREDENTIALS_PATH");
        if (StringUtils.hasText(fromEnv)) {
            return fromEnv;
        }
        String fromProp = System.getProperty("VERTEX_CREDENTIALS_PATH");
        if (StringUtils.hasText(fromProp)) {
            return fromProp;
        }
        // Fallback: read from .env in repo root if spring-dotenv didn't load it.
        String userDir = System.getProperty("user.dir");
        if (!StringUtils.hasText(userDir)) {
            return null;
        }
        Path cwd = Path.of(userDir);
        String fromFile = readEnvVar(cwd.resolve(".env"));
        if (StringUtils.hasText(fromFile)) {
            return fromFile;
        }
        Path parent = cwd.getParent();
        if (parent != null) {
            return readEnvVar(parent.resolve(".env"));
        }
        return null;
    }

    private String readEnvVar(Path envFile) {
        if (envFile == null || !Files.exists(envFile)) {
            return null;
        }
        try {
            for (String line : Files.readAllLines(envFile)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }
                if (!trimmed.startsWith("VERTEX_CREDENTIALS_PATH=")) {
                    continue;
                }
                String value = trimmed.substring("VERTEX_CREDENTIALS_PATH=".length());
                return value.trim();
            }
        } catch (IOException ignored) {
            return null;
        }
        return null;
    }

    private String requireProjectId() {
        String value = properties.getProjectId();
        if (!StringUtils.hasText(value)) {
            value = resolveEnvOrFile("VERTEX_PROJECT_ID");
        }
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("vertex.ai.project-id no esta configurado.");
        }
        return value;
    }

    private String requireLocation() {
        String value = properties.getLocation();
        if (!StringUtils.hasText(value)) {
            value = resolveEnvOrFile("VERTEX_LOCATION");
        }
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("vertex.ai.location no esta configurado.");
        }
        return value;
    }

    private String requireModel() {
        String value = properties.getModel();
        if (!StringUtils.hasText(value)) {
            value = resolveEnvOrFile("VERTEX_MODEL");
        }
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("vertex.ai.model no esta configurado.");
        }
        return value;
    }

    private String requireEmbeddingModel() {
        String value = properties.getEmbeddingModel();
        if (!StringUtils.hasText(value)) {
            value = resolveEnvOrFile("VERTEX_EMBEDDING_MODEL");
        }
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("vertex.ai.embedding-model no esta configurado.");
        }
        return value;
    }

    private String resolveEnvOrFile(String key) {
        String fromEnv = System.getenv(key);
        if (StringUtils.hasText(fromEnv)) {
            return fromEnv;
        }
        String fromProp = System.getProperty(key);
        if (StringUtils.hasText(fromProp)) {
            return fromProp;
        }
        String userDir = System.getProperty("user.dir");
        if (!StringUtils.hasText(userDir)) {
            return null;
        }
        Path cwd = Path.of(userDir);
        String fromFile = readEnvKey(cwd.resolve(".env"), key);
        if (StringUtils.hasText(fromFile)) {
            return fromFile;
        }
        Path parent = cwd.getParent();
        if (parent != null) {
            return readEnvKey(parent.resolve(".env"), key);
        }
        return null;
    }

    private String readEnvKey(Path envFile, String key) {
        if (envFile == null || !Files.exists(envFile)) {
            return null;
        }
        String prefix = key + "=";
        try {
            for (String line : Files.readAllLines(envFile)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }
                if (!trimmed.startsWith(prefix)) {
                    continue;
                }
                return trimmed.substring(prefix.length()).trim();
            }
        } catch (IOException ignored) {
            return null;
        }
        return null;
    }
}
