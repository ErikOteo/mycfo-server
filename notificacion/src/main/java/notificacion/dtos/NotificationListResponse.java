// src/main/java/notificacion/dtos/NotificationListResponse.java
package notificacion.dtos;

import java.util.List;

public record NotificationListResponse(
        int unread,
        List<NotificationDTO> items
) {}
