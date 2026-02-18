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

    // Mejor modelo para extracción estructurada
    private String model = "gemini-2.5-flash";

    private String credentialsPath;

    // Muy importante para JSON estructurado
    private double temperature = 0.0;

    // NUEVAS PROPIEDADES IMPORTANTES
    private double topP = 1.0;
    private int topK = 40;
    private boolean structuredOutput = true;
}
