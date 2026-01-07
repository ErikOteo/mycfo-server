package notificacion.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailConfigurationService {

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${notifications.email.from:noreply@mycfo.com}")
    private String fromEmail;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private boolean auth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private boolean starttls;

    public boolean isEmailConfigured() {
        return username != null && !username.isEmpty() && 
               !username.equals("tu-email@gmail.com") &&
               !username.equals("tu-email@mycfo.com");
    }

    public String getHost() {
        return host;
    }

    public int getPort() {
        return port;
    }

    public String getUsername() {
        return username;
    }

    public String getFromEmail() {
        return fromEmail;
    }

    public boolean isAuth() {
        return auth;
    }

    public boolean isStarttls() {
        return starttls;
    }

    public String getConfigurationStatus() {
        if (!isEmailConfigured()) {
            return "NOT_CONFIGURED";
        }
        return "CONFIGURED";
    }

    public String getConfigurationInfo() {
        if (!isEmailConfigured()) {
            return "Email no configurado. Configure las credenciales en application.properties";
        }
        return String.format("Email configurado: %s@%s:%d", username, host, port);
    }
}
