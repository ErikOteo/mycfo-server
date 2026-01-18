package notificacion.dtos;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Evento cuando un presupuesto se acerca al límite (ej. 80%).
 */
public record BudgetWarningEvent(
        Long userId,
        Long budgetId,
        String budgetName,
        String category,          // opcional: si es por categoría
        BigDecimal budgeted,
        BigDecimal actual,
        BigDecimal executedPercent,
        String period,
        String link,
        Instant occurredAt
) {}
