package registro.cargarDatos.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsSessionCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.transcribe.TranscribeClient;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class AwsTranscribeConfig {

    private final AwsTranscribeProperties awsTranscribeProperties;

    @Value("${aws.accessKeyId:}")
    private String accessKeyId;

    @Value("${aws.secretAccessKey:}")
    private String secretAccessKey;

    @Value("${aws.sessionToken:}")
    private String sessionToken;

    @Bean
    public TranscribeClient transcribeClient() {
        return TranscribeClient.builder()
                .credentialsProvider(resolveCredentialsProvider())
                .region(Region.of(awsTranscribeProperties.getRegion()))
                .build();
    }

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .credentialsProvider(resolveCredentialsProvider())
                .region(Region.of(awsTranscribeProperties.getRegion()))
                .build();
    }

    private AwsCredentialsProvider resolveCredentialsProvider() {
        if (StringUtils.hasText(accessKeyId) && StringUtils.hasText(secretAccessKey)) {
            log.info("Usando credenciales AWS explícitas para Transcribe/S3 (accessKeyId={}...)", mask(accessKeyId));
            if (StringUtils.hasText(sessionToken)) {
                AwsSessionCredentials sessionCredentials = AwsSessionCredentials.create(accessKeyId, secretAccessKey, sessionToken);
                return StaticCredentialsProvider.create(sessionCredentials);
            }
            AwsBasicCredentials basicCredentials = AwsBasicCredentials.create(accessKeyId, secretAccessKey);
            return StaticCredentialsProvider.create(basicCredentials);
        }

        log.warn("No se configuraron credenciales explícitas para Transcribe/S3; se usará DefaultCredentialsProvider.");
        return DefaultCredentialsProvider.create();
    }

    private String mask(String value) {
        if (!StringUtils.hasText(value) || value.length() < 4) {
            return "****";
        }
        return value.substring(0, 4) + "****";
    }
}

