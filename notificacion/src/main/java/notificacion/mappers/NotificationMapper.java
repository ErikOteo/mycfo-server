// src/main/java/notificacion/mappers/NotificationMapper.java
package notificacion.mappers;

import notificacion.dtos.NotificationDTO;
import notificacion.models.Notification;

public class NotificationMapper {
    public static NotificationDTO toDTO(Notification n) {
        return new NotificationDTO(
                n.getId(),
                n.getTitle(),
                n.getBody(),
                // badge: usaremos el nombre del type como etiqueta "bonita"
                prettify(n.getType().name()),
                n.isRead(),
                n.getCreatedAt(),
                n.getResourceType() != null ? n.getResourceType().name() : null,
                n.getResourceId(),
                n.getActionUrl()
        );
    }

    private static String prettify(String code) {
        return switch (code) {
            case "MOVEMENT_NEW" -> "Movimiento";
            case "MOVEMENT_HIGH" -> "Alto";
            case "MOVEMENT_DUPLICATE" -> "Duplicado";
            case "KEYWORD_REMINDER" -> "Recordatorio";
            case "BUDGET_INFO" -> "Presupuesto";
            default -> code;
        };
    }
}

