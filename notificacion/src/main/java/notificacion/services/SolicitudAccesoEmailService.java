package notificacion.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SolicitudAccesoEmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final RestTemplate restTemplate;

    @Value("${notifications.email.from:${spring.mail.username}}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.administracion.url:http://localhost:8081}")
    private String administracionUrl;

    public void notificarSolicitudAcceso(String subColaborador, String nombreColaborador, String emailColaborador) {
        try {
            System.out.println("🔍 [SOLICITUD-ACCESO-SERVICE] Buscando dueño para colaborador: " + subColaborador);
            // 1. Obtener email del propietario desde administración
            String emailOwner = obtenerEmailOwner(subColaborador);
            System.out.println("📧 [SOLICITUD-ACCESO-SERVICE] Dueño encontrado: " + emailOwner);

            // 2. Enviar email
            System.out.println("📤 [SOLICITUD-ACCESO-SERVICE] Enviando email de solicitud...");
            enviarEmailSolicitud(emailOwner, nombreColaborador, emailColaborador);
            System.out.println("✅ [SOLICITUD-ACCESO-SERVICE] Email enviado correctamente");

        } catch (Exception e) {
            System.err.println("❌ [SOLICITUD-ACCESO-SERVICE] Error fatal: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error notificando al propietario: " + e.getMessage());
        }
    }

    private String obtenerEmailOwner(String subColaborador) {
        String url = administracionUrl + "/api/empresas/owner-email-por-usuario/" + subColaborador;
        System.out.println("🔗 [SOLICITUD-ACCESO-SERVICE] Llamando a administración: " + url);
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String email = (String) response.getBody().get("emailOwner");
                if (email == null) {
                    throw new RuntimeException("Administración respondió OK pero sin emailOwner");
                }
                return email;
            }
            throw new RuntimeException("Administración respondió con status: " + response.getStatusCode());
        } catch (Exception e) {
            System.err.println("❌ [SOLICITUD-ACCESO-SERVICE] Error en endpoint de administración: " + e.getMessage());
            throw new RuntimeException(
                    "No se pudo obtener el email del propietario desde administración: " + e.getMessage());
        }
    }

    private void enviarEmailSolicitud(String emailOwner, String nombreCol, String emailCol) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(emailOwner);
            helper.setSubject("Nueva solicitud de acceso en MyCFO");

            Context context = new Context(new Locale("es", "ES"));
            context.setVariable("colaboradorNombre", nombreCol);
            context.setVariable("colaboradorEmail", emailCol);
            context.setVariable("adminLink", frontendUrl + "/#/roles");

            System.out.println("📝 [SOLICITUD-ACCESO-SERVICE] Procesando template para: " + emailOwner);
            String htmlContent = templateEngine.process("solicitud-acceso-email", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("🚀 [SOLICITUD-ACCESO-SERVICE] Email enviado vía SMTP!");
        } catch (MessagingException e) {
            System.err.println("❌ [SOLICITUD-ACCESO-SERVICE] Error de SMTP: " + e.getMessage());
            throw new RuntimeException("Error enviando email (SMTP)", e);
        } catch (Exception e) {
            System.err.println("❌ [SOLICITUD-ACCESO-SERVICE] Error inesperado en envío: " + e.getMessage());
            throw new RuntimeException("Error inesperado enviando email", e);
        }
    }
}
