package registro.cargarDatos.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "vertex.ai")
public class VertexAiProperties {

    private String projectId;
    private String location = "us-central1";
    private String model = "gemini-2.5-pro";
    private String credentialsPath;
    private double temperature = 0.0;
    private int maxOutputTokens = 50000;
}
