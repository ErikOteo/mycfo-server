package notificacion.dtos;

import java.time.Instant;

public record MovementDuplicateEvent(
        String userId,
        String refId,
        String description,
        String accountName,
        Instant occurredAt,
        String duplicateOfRef
) {}
