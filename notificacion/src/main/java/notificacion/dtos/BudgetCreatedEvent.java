package notificacion.dtos;

import jakarta.validation.constraints.NotNull;

public record BudgetCreatedEvent(
        @NotNull String userId,
        @NotNull Long companyId,
        @NotNull Long budgetId,
        @NotNull String budgetName,
        String period,
        String link
) {}
