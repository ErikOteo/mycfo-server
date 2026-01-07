package registro.mercadopago.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Setter
@Getter
@Component
@Validated
@ConfigurationProperties(prefix = "mercadopago")
public class MpProperties {

    /** Requeridos por OAuth */
    private String clientId;

    private String clientSecret;

    /**
     * Debe ser EXACTAMENTE el callback registrado en MP Developers (https + ngrok),
     * por ej: https://xxxx-xx-xx-xx.ngrok-free.app/api/mp/oauth/callback
     */
    private String redirectUri;

    /**
     * URL del FRONT para redirigir luego del callback (React local, por ej. http://localhost:3000)
     */
    private String frontendUrl;

    /**
     * Base API de MP (token, users, payments). Default oficial.
     */
    private String apiBase = "https://api.mercadopago.com";

    /**
     * Endpoint de autorización. En Argentina conviene usar ML AR:
     * https://auth.mercadolibre.com.ar/authorization
     * Lo dejo configurable; si no seteás nada, usa mercadolibre AR por defecto.
     */
    private String oauthAuthorize = "https://auth.mercadolibre.com.ar/authorization";

    /**
     * Scopes opcionales (puede ir vacío).
     */
    private String scope = "";

    /**
     * TTL del state (ms). Default 10 min.
     */
    private long stateTtlSeconds = 600;

    /**
     * Clave dedicada para firmar/verificar el 'state' (mejor que reutilizar clientSecret).
     * Si no se setea, se usa clientSecret como fallback (no recomendado en prod).
     */
    private String stateSigningSecret;

    /* ===== Helpers para normalizar y exponer valores seguros ===== */

    public String getApiBase() {
        return stripTrailingSlash(apiBase);
    }

    public String getOauthAuthorize() {
        return stripTrailingSlash(oauthAuthorize);
    }

    public String getRedirectUri() {
        return stripTrailingSlash(redirectUri);
    }

    public String getFrontendUrl() {
        return stripTrailingSlash(frontendUrl);
    }

    public String effectiveStateSigningSecret() {
        return (stateSigningSecret != null && !stateSigningSecret.isBlank())
                ? stateSigningSecret
                : clientSecret; // fallback
    }

    public int getStateTtlSeconds() {
        return (int) Math.max(60, stateTtlSeconds); // mínimo 60s
    }

    private String stripTrailingSlash(String s) {
        if (s == null) return null;
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    @PostConstruct
    public void checkProps() {
        System.out.println(">>> MP Config");
        System.out.println("    clientId       = " + safe(clientId));
        System.out.println("    redirectUri    = " + redirectUri);
        System.out.println("    frontendUrl    = " + frontendUrl);
        System.out.println("    apiBase        = " + apiBase);
        System.out.println("    oauthAuthorize = " + oauthAuthorize);
        System.out.println("    scope          = " + scope);
        System.out.println("    stateTTL (s)   = " + stateTtlSeconds);
        System.out.println("    stateSecretSet = " + (stateSigningSecret != null && !stateSigningSecret.isBlank()));
    }

    private String safe(String v) {
        if (v == null || v.length() < 6) return "****";
        return v.substring(0, 3) + "****" + v.substring(v.length() - 2);
    }
}

