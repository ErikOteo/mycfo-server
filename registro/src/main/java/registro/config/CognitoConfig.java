package registro.config;

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
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;

@Configuration
@Slf4j
public class CognitoConfig {

    @Value("${aws.accessKeyId:}")
    private String accessKeyId;

    @Value("${aws.secretAccessKey:}")
    private String secretAccessKey;

    @Value("${aws.sessionToken:}")
    private String sessionToken;

    @Value("${aws.region:sa-east-1}")
    private String region;

    @Bean
    public CognitoIdentityProviderClient cognitoClient() {
        AwsCredentialsProvider credentialsProvider = resolveCredentialsProvider();
        log.info("Configurando Cognito con región {}", region);
        return CognitoIdentityProviderClient.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider)
                .build();
    }

    private AwsCredentialsProvider resolveCredentialsProvider() {
        if (StringUtils.hasText(accessKeyId) && StringUtils.hasText(secretAccessKey)) {
            log.info("Usando credenciales AWS explícitas (accessKeyId={}...)", mask(accessKeyId));
            if (StringUtils.hasText(sessionToken)) {
                return StaticCredentialsProvider.create(AwsSessionCredentials.create(accessKeyId, secretAccessKey, sessionToken));
            }
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyId, secretAccessKey));
        }
        log.warn("No se configuraron credenciales explícitas. Usando Default.");
        return DefaultCredentialsProvider.create();
    }

    private String mask(String value) {
        return (StringUtils.hasText(value) && value.length() >= 4) ? value.substring(0, 4) + "****" : "****";
    }
}