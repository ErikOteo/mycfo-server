package notificacion.dtos;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Evento para facturas o cuentas por pagar próximas a vencer.
 */
public record BillDueEvent(
        String userId,
        Long billId,
        String billNumber,
        Instant dueDate,
        BigDecimal amount,
        Integer daysUntilDue,
        String link
) {}
