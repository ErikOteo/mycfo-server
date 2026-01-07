package registro.cargarDatos.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "aws.transcribe")
public class AwsTranscribeProperties {

    /**
     * Región de AWS donde se ejecutará Transcribe y se ubica el bucket S3.
     * Ejemplo: us-east-1.
     */
    private String region = "us-east-1";

    /**
     * Nombre del bucket S3 utilizado para subir audios temporales.
     */
    private String bucket;

    /**
     * Código de idioma soportado por AWS Transcribe, por defecto español.
     */
    private String languageCode = "es-ES";

    /**
     * Intervalo en segundos entre cada consulta al estado del job de transcripción.
     */
    private int pollIntervalSeconds = 3;

    /**
     * Tiempo máximo de espera en segundos para que finalice el job.
     */
    private int maxWaitSeconds = 120;

    /**
     * Eliminar o no el archivo original del bucket una vez transcripto.
     */
    private boolean deleteSourceObject = true;
    
    /**
     * Cantidad máxima de intentos para descargar el transcript desde S3.
     */
    private int downloadMaxAttempts = 30;

}

