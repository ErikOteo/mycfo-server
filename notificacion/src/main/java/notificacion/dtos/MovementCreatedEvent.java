package notificacion.dtos;

import java.math.BigDecimal;
import java.time.Instant;

public record MovementCreatedEvent(
        String userId,        // UUID string del usuario autenticado
        String refId,         // obligatorio para idempotencia
        Instant date,
        BigDecimal amount,    // >0 ingreso; <0 egreso
        String description,
        String currency       // ISO o etiqueta ("ARS", "USD")
) {}
