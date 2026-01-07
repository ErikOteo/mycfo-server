package registro.movimientosexcel.dtos;

import java.math.BigDecimal;
import java.time.Instant;

public record MovementEventPayload(
        Long userId,
        String refId,
        Instant date,
        Double amount,
        String description
) {}
