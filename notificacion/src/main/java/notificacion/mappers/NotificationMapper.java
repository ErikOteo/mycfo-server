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
                n.getType().name(),
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
            case "MOVEMENT_IMPORT" -> "Importación";
            case "ACCOUNT_MP_LINKED" -> "MP Vinculado";
            case "MOVEMENT_DUPLICATE" -> "Duplicado";
            case "KEYWORD_REMINDER" -> "Recordatorio";
            case "BUDGET_INFO" -> "Presupuesto";
            case "BUDGET_CREATED" -> "Presupuesto creado";
            case "BUDGET_DELETED" -> "Presupuesto eliminado";
            case "BUDGET_EXCEEDED" -> "Presupuesto excedido";
            case "BUDGET_WARNING" -> "Presupuesto alerta";
            case "BUDGET_MISSING_CATEGORY" -> "Categoría sin presupuesto";
            case "REPORT_READY" -> "Reporte listo";
            case "REPORT_ANOMALY" -> "Reporte con alertas";
            case "MONTHLY_SUMMARY" -> "Resumen mensual";
            case "CASH_FLOW_ALERT" -> "Cash Flow";
            case "REMINDER_DEADLINE" -> "Recordatorio próximo";
            case "REMINDER_CREATED" -> "Recordatorio creado";
            case "FORECAST_REMINDER" -> "Recordatorio pronóstico";
            case "CONCILIATION_REMINDER" -> "Recordatorio conciliación";
            default -> code;
        };
    }
}

