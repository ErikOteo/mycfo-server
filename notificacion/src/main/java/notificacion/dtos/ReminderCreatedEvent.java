package notificacion.dtos;

import java.time.Instant;

public record ReminderCreatedEvent(
        String userId,
        String title,
        String message,
        Instant scheduledFor,
        String reminderType
) {}
