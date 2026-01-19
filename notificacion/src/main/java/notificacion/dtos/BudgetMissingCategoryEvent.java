package notificacion.dtos;

import java.time.Instant;

/**
 * Evento para categorías que no tienen presupuesto asignado en el período.
 */
public record BudgetMissingCategoryEvent(
        Long userId,
        String category,
        String period,
        Long companyId,
        Instant occurredAt
) {}
