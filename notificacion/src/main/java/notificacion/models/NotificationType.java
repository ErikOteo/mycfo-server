// src/main/java/notificacion/models/NotificationType.java
package notificacion.models;

public enum NotificationType {
    // MOVIMIENTOS FINANCIEROS
    MOVEMENT_NEW,           // Nuevo movimiento detectado
    MOVEMENT_HIGH,          // Movimiento con monto alto
    MOVEMENT_DUPLICATE,     // Movimiento duplicado detectado
    MOVEMENT_CATEGORIZED,   // Movimiento categorizado automáticamente
    MOVEMENT_IMPORT,        // Importación de movimientos (Excel/CSV)
    ACCOUNT_MP_LINKED,      // Cuenta vinculada a Mercado Pago
    
    // PRESUPUESTOS Y PRONÓSTICOS
    BUDGET_CREATED,         // Presupuesto creado
    BUDGET_DELETED,         // Presupuesto eliminado
    BUDGET_EXCEEDED,        // Presupuesto excedido
    BUDGET_WARNING,         // Presupuesto cerca del límite (80%)
    BUDGET_COMPLETED,       // Presupuesto completado
    FORECAST_ALERT,         // Alerta de pronóstico
    CASH_FLOW_ALERT,        // Alerta de cash flow negativo
    BUDGET_MISSING_CATEGORY,// Categoria sin presupuesto asignado
    
    // REPORTES Y ANÁLISIS
    REPORT_READY,           // Reporte generado
    REPORT_ANOMALY,         // Anomalía detectada en reporte
    MONTHLY_SUMMARY,        // Resumen mensual disponible
    
    // RECORDATORIOS Y ALERTAS PERSONALIZADAS
    REMINDER_CUSTOM,        // Recordatorio personalizado
    REMINDER_DEADLINE,      // Recordatorio de vencimiento
    REMINDER_RECURRING,     // Recordatorio recurrente
    REMINDER_DATA_LOAD,     // Recordatorio de carga de datos
    REMINDER_BILL_DUE,      // Recordatorio de vencimiento de factura
    REMINDER_CREATED,       // Se creó un nuevo recordatorio
    FORECAST_REMINDER,      // Recordatorio para generar pronósticos
    CONCILIATION_REMINDER,  // Recordatorio para conciliar movimientos
    
    // SISTEMA Y ADMINISTRACIÓN
    SYSTEM_MAINTENANCE,     // Mantenimiento programado
    USER_INVITED,           // Usuario invitado
    ROLE_CHANGED,           // Rol modificado
    DATA_IMPORTED,          // Datos importados
    DATA_EXPORTED,          // Datos exportados
    RECONCILIATION_STALE,   // Movimientos sin conciliar
    
    // LEGACY (mantener compatibilidad)
    KEYWORD_REMINDER,       // Recordatorio por palabra clave
    BUDGET_INFO             // Información de presupuesto
}
