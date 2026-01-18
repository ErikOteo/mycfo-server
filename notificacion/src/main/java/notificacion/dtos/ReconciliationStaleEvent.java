package notificacion.dtos;

import java.time.Instant;

/**
 * Evento para movimientos sin conciliar por más de N días.
 */
public record ReconciliationStaleEvent(
        String userId,
        Long accountId,
        String accountName,
        int daysStale,
        int pendingCount,
        Instant asOf,
        String link
) {}
