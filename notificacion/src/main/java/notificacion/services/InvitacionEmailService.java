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
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InvitacionEmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final RestTemplate restTemplate;

    @Value("${notifications.email.from:${spring.mail.username}}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.administracion.url:http://localhost:8081}")
    private String administracionUrl;

    /**
     * Envía invitaciones a una lista de emails
     * @param emails Lista de emails a los que enviar invitaciones
     * @param subUsuarioInvitador Sub del usuario que envía las invitaciones
     */
    public void enviarInvitaciones(List<String> emails, String subUsuarioInvitador) {
        try {
            System.out.println("🚀 [INVITACIONES] Iniciando proceso de invitaciones");
            System.out.println("📧 [INVITACIONES] Emails a procesar: " + emails);
            System.out.println("👤 [INVITACIONES] Usuario invitador: " + subUsuarioInvitador);
            
            // 1. Obtener nombre de empresa desde administración
            String nombreEmpresa = obtenerNombreEmpresa(subUsuarioInvitador);
            System.out.println("🏢 [INVITACIONES] Nombre de empresa obtenido: " + nombreEmpresa);
            
            // 2. Enviar email a cada dirección
            for (String email : emails) {
                enviarEmailInvitacion(email, nombreEmpresa, subUsuarioInvitador);
            }
            
            System.out.println("✅ [INVITACIONES] Proceso completado exitosamente");
            
        } catch (Exception e) {
            System.err.println("❌ [INVITACIONES] Error en proceso de invitaciones: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error enviando invitaciones: " + e.getMessage());
        }
    }

    /**
     * Obtiene el nombre de la empresa del usuario desde el módulo de administración
     */
    private String obtenerNombreEmpresa(String subUsuario) {
        try {
            System.out.println("🔍 [EMPRESA] Obteniendo nombre de empresa para usuario: " + subUsuario);
            
            String url = administracionUrl + "/api/empresas/nombre-por-usuario/" + subUsuario;
            System.out.println("🔗 [EMPRESA] URL: " + url);
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            System.out.println("📊 [EMPRESA] Response status: " + response.getStatusCode());
            System.out.println("📄 [EMPRESA] Response body: " + response.getBody());
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String nombreEmpresa = (String) response.getBody().get("nombreEmpresa");
                System.out.println("✅ [EMPRESA] Nombre obtenido: " + nombreEmpresa);
                return nombreEmpresa;
            } else {
                throw new RuntimeException("Error obteniendo nombre de empresa: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            System.err.println("❌ [EMPRESA] Error obteniendo nombre de empresa: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error obteniendo nombre de empresa: " + e.getMessage());
        }
    }

    /**
     * Envía un email de invitación individual
     */
    private void enviarEmailInvitacion(String email, String empresaNombre, String subUsuarioInvitador) {
        try {
            System.out.println("📧 [EMAIL-INDIVIDUAL] Preparando email para: " + email);
            System.out.println("🏢 [EMAIL-INDIVIDUAL] Empresa: " + empresaNombre);
            System.out.println("📤 [EMAIL-INDIVIDUAL] From email: " + fromEmail);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("Invitación para unirse a " + empresaNombre + " en MyCFO");
            
            System.out.println("📝 [EMAIL-INDIVIDUAL] Subject: " + helper.getMimeMessage().getSubject());

            // Crear contexto para el template
            Context context = new Context(new Locale("es", "ES"));
            context.setVariable("empresaNombre", empresaNombre);
            context.setVariable("email", email);
            context.setVariable("frontendUrl", frontendUrl);
            
            // Crear link de invitación (sin token por ahora, solo con empresa)
            String invitacionLink = frontendUrl + "/#/signup?empresa=" + empresaNombre.replaceAll(" ", "%20");
            context.setVariable("invitacionLink", invitacionLink);
            
            System.out.println("🔗 [EMAIL-INDIVIDUAL] Link de invitación: " + invitacionLink);

            // Procesar template
            String htmlContent = templateEngine.process("invitacion-email", context);
            helper.setText(htmlContent, true);
            
            System.out.println("📄 [EMAIL-INDIVIDUAL] HTML content length: " + htmlContent.length());

            // Enviar email
            mailSender.send(message);
            System.out.println("✅ [EMAIL-INDIVIDUAL] Email de invitación enviado exitosamente a: " + email);
            
        } catch (MessagingException e) {
            System.err.println("❌ [EMAIL-INDIVIDUAL] Error enviando email de invitación a " + email + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error enviando email a " + email + ": " + e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ [EMAIL-INDIVIDUAL] Error inesperado enviando email a " + email + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error inesperado enviando email a " + email + ": " + e.getMessage());
        }
    }
}