package notificacion.services;

import notificacion.models.CustomReminder;
import notificacion.models.Notification;
import notificacion.models.NotificationType;
import notificacion.models.Severity;
import notificacion.repositories.CustomReminderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class CustomReminderService {

    private final CustomReminderRepository reminderRepository;
    private final NotificationService notificationService;
    private final EmailNotificationService emailService;

    public CustomReminderService(CustomReminderRepository reminderRepository,
                                 NotificationService notificationService,
                                 EmailNotificationService emailService) {
        this.reminderRepository = reminderRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Transactional
    public CustomReminder createReminder(Long organizacionId,
                                         String usuarioId,
                                         String title,
                                         String message,
                                         Instant scheduledFor,
                                         boolean isRecurring,
                                         CustomReminder.RecurrencePattern pattern) {
        CustomReminder reminder = new CustomReminder();
        reminder.setOrganizacionId(organizacionId);
        reminder.setUsuarioId(usuarioId);
        reminder.setTitle(title);
        reminder.setMessage(message);
        reminder.setScheduledFor(scheduledFor);
        reminder.setRecurring(isRecurring);
        reminder.setRecurrencePattern(pattern);
        reminder.setActive(true);

        if (isRecurring) {
            reminder.initializeNextTrigger();
        }

        CustomReminder saved = reminderRepository.save(reminder);

        // Notificación de recordatorio creado
        Notification notification = new Notification();
        notification.setOrganizacionId(organizacionId);
        notification.setUsuarioId(usuarioId);
        notification.setType(NotificationType.REMINDER_CREATED);
        notification.setTitle("Nuevo recordatorio creado");
        notification.setBody("%s - %s".formatted(
                title != null ? title : "Recordatorio",
                message != null ? message : ""));
        notification.setSeverity(Severity.INFO);
        notification.setResourceType(notificacion.models.ResourceType.SYSTEM);
        notification.setResourceId("reminder_created_" + saved.getId());
        notification.setCreatedAt(Instant.now());
        notificationService.create(notification);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<CustomReminder> getUserReminders(Long organizacionId, String usuarioId) {
        return reminderRepository.findByOrganizacionIdAndUsuarioIdAndIsActiveTrueOrderByScheduledForAsc(organizacionId, usuarioId);
    }

    @Transactional
    public void deleteReminder(Long organizacionId, String usuarioId, Long reminderId) {
        CustomReminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new IllegalArgumentException("Recordatorio no encontrado"));
        enforceTenant(reminder, organizacionId, usuarioId);
        reminder.setActive(false);
        reminderRepository.save(reminder);
    }

    @Transactional
    public void updateReminder(Long organizacionId,
                               String usuarioId,
                               Long reminderId,
                               String title,
                               String message,
                               Instant scheduledFor,
                               boolean isRecurring,
                               CustomReminder.RecurrencePattern pattern) {
        CustomReminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new IllegalArgumentException("Recordatorio no encontrado"));

        enforceTenant(reminder, organizacionId, usuarioId);

        reminder.setTitle(title);
        reminder.setMessage(message);
        reminder.setScheduledFor(scheduledFor);
        reminder.setRecurring(isRecurring);
        reminder.setRecurrencePattern(pattern);

        if (isRecurring) {
            reminder.calculateNextTrigger();
        } else {
            reminder.setNextTrigger(null);
        }

        reminderRepository.save(reminder);
    }

    @Transactional(readOnly = true)
    public CustomReminder getReminder(Long organizacionId, String usuarioId, Long reminderId) {
        CustomReminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new IllegalArgumentException("Recordatorio no encontrado"));
        enforceTenant(reminder, organizacionId, usuarioId);
        return reminder;
    }

    // Ejecutar cada minuto para verificar recordatorios pendientes
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processDueReminders() {
        Instant now = Instant.now();

        List<CustomReminder> dueReminders = reminderRepository.findDueReminders(now);
        for (CustomReminder reminder : dueReminders) {
            createNotificationFromReminder(reminder);
            reminder.setActive(false);
            reminderRepository.save(reminder);
        }

        List<CustomReminder> recurringReminders = reminderRepository.findRecurringReminders(now);
        for (CustomReminder reminder : recurringReminders) {
            createNotificationFromReminder(reminder);
            reminder.markAsTriggered();
            if (reminder.getNextTrigger() == null) {
                reminder.setActive(false);
            }
            reminderRepository.save(reminder);
        }
    }

    private void createNotificationFromReminder(CustomReminder reminder) {
        Notification notification = new Notification();
        notification.setOrganizacionId(reminder.getOrganizacionId());
        notification.setUsuarioId(reminder.getUsuarioId());
        notification.setType(NotificationType.REMINDER_CUSTOM);
        notification.setTitle(reminder.getTitle());
        notification.setBody(reminder.getMessage());
        notification.setSeverity(Severity.INFO);
        notification.setResourceType(notificacion.models.ResourceType.SYSTEM);
        notification.setResourceId("reminder_" + reminder.getId());
        notification.setCreatedAt(Instant.now());

        notificationService.create(notification);

        // Enviamos el mail específico de recordatorio (sujeto "Recordatorio: <titulo>")
        try {
            emailService.sendReminderEmail(reminder.getOrganizacionId(), reminder.getUsuarioId(), reminder);
        } catch (Exception e) {
            System.err.println("Error enviando email de recordatorio: " + e.getMessage());
        }
    }

    private void enforceTenant(CustomReminder reminder, Long organizacionId, String usuarioId) {
        if (!reminder.getOrganizacionId().equals(organizacionId) ||
            !reminder.getUsuarioId().equals(usuarioId)) {
            throw new IllegalArgumentException("Recordatorio fuera del alcance del usuario actual");
        }
    }
}
