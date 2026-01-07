package notificacion.dtos;

import java.time.Instant;

public record CustomReminderEvent(
    Long userId,
    String title,
    String message,
    Instant scheduledFor,
    boolean isRecurring,
    String recurrencePattern,
    String reminderType
) {}
