package notificacion.dtos;

public record ConciliationReminderEvent(
        String userId,
        String accountName,
        int pendingDays
) {}
