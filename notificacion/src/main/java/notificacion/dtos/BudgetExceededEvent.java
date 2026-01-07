package notificacion.dtos;

import java.math.BigDecimal;
import java.time.Instant;

public record BudgetExceededEvent(
    Long userId,
    Long budgetId,
    String budgetName,
    String category,
    BigDecimal budgeted,
    BigDecimal actual,
    BigDecimal variance,
    Instant occurredAt
) {}
