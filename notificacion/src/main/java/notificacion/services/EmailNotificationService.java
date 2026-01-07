package notificacion.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import notificacion.models.CustomReminder;
import notificacion.models.Notification;
import notificacion.models.NotificationPreferences;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;
    private final NotificationPreferencesService preferencesService;
    private final TemplateEngine templateEngine;
    private final AdministracionService administracionService;

    @Value("${notifications.email.from:${spring.mail.username}}")
    private String fromEmail;

    @Transactional
    public void sendNotificationEmail(Long organizacionId, String usuarioId, Notification notification) {
        if (!preferencesService.isEmailEnabled(organizacionId, usuarioId, notification.getType())) {
            return;
        }

        if (preferencesService.isInQuietHours(organizacionId, usuarioId)) {
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(getUserEmail(organizacionId, usuarioId));
            helper.setSubject("MyCFO - " + notification.getTitle());

            Context context = new Context(new Locale("es", "ES"));
            context.setVariable("title", notification.getTitle());
            context.setVariable("body", sanitizeBody(notification.getBody()));
            context.setVariable("date", notification.getCreatedAt().toString());
            context.setVariable("severity", notification.getSeverity().name().toLowerCase());
            context.setVariable("notification", notification);

            String htmlContent = templateEngine.process("notification-email", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Error enviando email: " + e.getMessage());
        }
    }

    @Transactional
    public void sendDailyDigest(Long organizacionId, String usuarioId, List<Notification> notifications) {
        NotificationPreferences prefs = preferencesService.getPreferences(organizacionId, usuarioId).orElse(null);
        if (prefs == null || !prefs.isDailyDigestEnabled() || notifications.isEmpty()) {
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(getUserEmail(organizacionId, usuarioId));
            helper.setSubject("MyCFO - Resumen Diario de Notificaciones");

            Context context = new Context(new Locale("es", "ES"));
            context.setVariable("notifications", notifications);
            context.setVariable("digestType", "Diario");
            context.setVariable("date", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

            String htmlContent = templateEngine.process("digest-email", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Error enviando digest diario: " + e.getMessage());
        }
    }

    @Transactional
    public void sendWeeklyDigest(Long organizacionId, String usuarioId, List<Notification> notifications) {
        NotificationPreferences prefs = preferencesService.getPreferences(organizacionId, usuarioId).orElse(null);
        if (prefs == null || !prefs.isWeeklyDigestEnabled() || notifications.isEmpty()) {
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(getUserEmail(organizacionId, usuarioId));
            helper.setSubject("MyCFO - Resumen Semanal de Notificaciones");

            Context context = new Context(new Locale("es", "ES"));
            context.setVariable("notifications", notifications);
            context.setVariable("digestType", "Semanal");
            context.setVariable("date", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

            String htmlContent = templateEngine.process("digest-email", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Error enviando digest semanal: " + e.getMessage());
        }
    }

    @Transactional
    public void sendReminderEmail(Long organizacionId, String usuarioId, CustomReminder reminder) {
        try {
            String userEmail = getUserEmail(organizacionId, usuarioId);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(userEmail);
            helper.setSubject("MyCFO - Recordatorio: " + reminder.getTitle());
            helper.setFrom(fromEmail);

            Context context = new Context(new Locale("es", "ES"));
            context.setVariable("reminder", reminder);

            String htmlContent = templateEngine.process("reminder-email", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Error enviando email de recordatorio: " + e.getMessage());
        }
    }

    private String getUserEmail(Long organizacionId, String usuarioId) {
        NotificationPreferences prefs = preferencesService.getPreferences(organizacionId, usuarioId).orElse(null);
        if (prefs != null && prefs.getUserEmail() != null && !prefs.getUserEmail().trim().isEmpty()) {
            return prefs.getUserEmail().trim();
        }
        try {
            String email = administracionService.obtenerEmailPorUsuarioSub(usuarioId);
            if (email != null && !email.trim().isEmpty()) {
                return email.trim();
            }
        } catch (RuntimeException e) {
            log.warn("No se pudo obtener el email del usuario {} desde administración: {}", usuarioId, e.getMessage());
        }
        return "mycfoarg@gmail.com";
    }

    private String sanitizeBody(String body) {
        if (body == null) {
            return null;
        }
        return body
                .replaceAll("\\$-?\\d+\\.\\d*E\\+\\d+", "Numero grande")
                .replaceAll("\\$-?\\d+E\\+\\d+", "Numero grande");
    }
}
