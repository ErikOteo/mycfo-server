package registro.cargarDatos.models;

/**
 * Enum unificado para todos los estados posibles de un movimiento
 */
public enum EstadoMovimiento {
    // Estados generales
    COBRADO,    // Para Ingresos y Acreencias cobradas
    PAGADO,     // Para Egresos y Deudas pagadas
    PENDIENTE,  // Para Deudas y Acreencias pendientes
    VENCIDO,    // Para Deudas y Acreencias vencidas
    PARCIAL,    // Para pagos/cobros parciales
    CANCELADO   // Para movimientos cancelados
}

