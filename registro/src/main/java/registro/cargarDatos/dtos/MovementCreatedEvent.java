package registro.cargarDatos.dtos;

import java.math.BigDecimal;
import java.time.Instant;

public record MovementCreatedEvent(
        String userId,        // UUID string del usuario autenticado
        String refId,         // ID de referencia para idempotencia
        Instant date,         // Fecha del movimiento
        BigDecimal amount,    // Monto (positivo ingreso, negativo egreso)
        String description    // Descripción del movimiento
) {}
