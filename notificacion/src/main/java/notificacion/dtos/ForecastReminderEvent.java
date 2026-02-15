package notificacion.dtos;

public record ForecastReminderEvent(
        String userId,
        String periodLabel
) {}
