package notificacion.dtos;

import java.time.Instant;

public record ReminderDeadlineEvent(
        String userId,
        String title,
        String message,
        Instant dueDate
) {}
