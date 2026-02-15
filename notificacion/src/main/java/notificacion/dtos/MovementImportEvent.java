package notificacion.dtos;

import java.time.Instant;

public record MovementImportEvent(
        String userId,
        String importId,
        String sourceName,
        String accountName,
        int totalRows,
        Instant importedAt
) {}
