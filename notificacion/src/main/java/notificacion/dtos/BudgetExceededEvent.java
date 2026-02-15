package notificacion.dtos;

import java.math.BigDecimal;
import java.time.Instant;

public record BudgetExceededEvent(
    String userId,
    Long budgetId,
    String budgetName,
    String category,
    String period,
    BigDecimal budgeted,
    BigDecimal actual,
    BigDecimal variance,
    Instant occurredAt
) {}
