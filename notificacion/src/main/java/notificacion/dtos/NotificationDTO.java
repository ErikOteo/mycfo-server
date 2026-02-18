// src/main/java/notificacion/dtos/NotificationDTO.java
package notificacion.dtos;

import java.time.Instant;

public record NotificationDTO(
        Long id,
        String title,
        String body,
        String type,      // código original del tipo
        String badge,      // etiqueta para UI
        boolean is_read,
        Instant date,
        String resource_type,
        String resource_id,
        String action_url
) {}
