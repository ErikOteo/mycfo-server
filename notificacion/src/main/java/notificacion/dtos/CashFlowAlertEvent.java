package notificacion.dtos;

import java.math.BigDecimal;
import java.time.Instant;

public record CashFlowAlertEvent(
    Long userId,
    String alertType, // "NEGATIVE", "LOW_BALANCE", "FORECAST_NEGATIVE"
    BigDecimal currentBalance,
    BigDecimal forecastBalance,
    String period,
    String message,
    Instant occurredAt
) {}
