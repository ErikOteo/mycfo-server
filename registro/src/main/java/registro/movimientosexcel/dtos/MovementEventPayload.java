package registro.movimientosexcel.dtos;

import java.time.Instant;

public record MovementEventPayload(
        String userId,
        String refId,
        Instant date,
        Double amount,
        String description,
        String currency
) {}
