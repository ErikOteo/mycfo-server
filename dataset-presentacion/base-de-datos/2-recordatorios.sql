-- =====================================================================
-- RECORDATORIOS PERSONALIZADOS (custom_reminders)
-- =====================================================================
SET @ORGANIZACION_ID := 1;
SET @USUARIO_ID   := '335c7a9a-d021-704f-ba63-9c18f37959f8';

-- =====================================================================
-- Recordatorio: Seguimiento de cobranzas pendientes
-- =====================================================================
INSERT INTO custom_reminders
    (usuario_id, organizacion_id, title, message, scheduled_for, is_recurring, recurrence_pattern, is_active, created_at)
VALUES
    (@USUARIO_ID, @ORGANIZACION_ID,
        'Seguimiento de cobranzas pendientes',
        'Revisar clientes con cobranzas pendientes mayores a 30 días para evitar pérdidas de liquidez.',
        DATE_ADD(NOW(), INTERVAL 3 DAY),
        TRUE,
        'WEEKLY',
        TRUE,
        NOW());

-- =====================================================================
-- Recordatorio: Cierre semanal de ventas
-- =====================================================================
INSERT INTO custom_reminders
    (usuario_id, organizacion_id, title, message, scheduled_for, is_recurring, recurrence_pattern, is_active, created_at)
VALUES
    (@USUARIO_ID, @ORGANIZACION_ID,
        'Cierre semanal de ventas',
        'Actualizar el registro de ventas y cobranzas antes del cierre semanal del panel de ingresos.',
        DATE_ADD(NOW(), INTERVAL 7 DAY),
        TRUE,
        'WEEKLY',
        TRUE,
        NOW());

-- =====================================================================
-- Recordatorio: Conciliación MP / bancario
-- =====================================================================
INSERT INTO custom_reminders
    (usuario_id, organizacion_id, title, message, scheduled_for, is_recurring, recurrence_pattern, is_active, created_at)
VALUES
    (@USUARIO_ID, @ORGANIZACION_ID,
        'Conciliar movimientos de Mercado Pago',
        'Conciliar movimientos nuevos de Mercado Pago con ingresos registrados en MyCFO.',
        DATE_ADD(NOW(), INTERVAL 2 DAY),
        TRUE,
        'WEEKLY',
        TRUE,
        NOW());

-- =====================================================================
-- Recordatorio: Emisión mensual de facturas
-- =====================================================================
INSERT INTO custom_reminders
    (usuario_id, organizacion_id, title, message, scheduled_for, is_recurring, recurrence_pattern, is_active, created_at)
VALUES
    (@USUARIO_ID, @ORGANIZACION_ID,
        'Emisión mensual de facturas',
        'Emitir facturas del período actual para Prestación de Servicios antes del día 5 de cada mes.',
        DATE_ADD(NOW(), INTERVAL 5 DAY),
        TRUE,
        'MONTHLY',
        TRUE,
        NOW());


-- =====================================================================
-- Recordatorio: Cierre contable del mes
-- =====================================================================
INSERT INTO custom_reminders
    (usuario_id, organizacion_id, title, message, scheduled_for, is_recurring, recurrence_pattern, is_active, created_at)
VALUES
    (@USUARIO_ID, @ORGANIZACION_ID,
        'Cierre contable mensual',
        'Completar el cierre contable del mes antes del día 3 del siguiente.',
        DATE_ADD(NOW(), INTERVAL 3 DAY),
        TRUE,
        'MONTHLY',
        TRUE,
        NOW());

-- =====================================================================
-- Recordatorio: Resumen semanal en Dashboard
-- =====================================================================
INSERT INTO custom_reminders
    (usuario_id, organizacion_id, title, message, scheduled_for, is_recurring, recurrence_pattern, is_active, created_at)
VALUES
    (@USUARIO_ID, @ORGANIZACION_ID,
        'Revisión del resumen semanal',
        'Revisar el resumen semanal en el Dashboard para validar ingresos, egresos y saldo neto.',
        DATE_ADD(NOW(), INTERVAL 1 DAY),
        TRUE,
        'WEEKLY',
        TRUE,
        NOW());

-- =====================================================================
-- Recordatorio: Importación de Excel
-- =====================================================================
INSERT INTO custom_reminders
    (usuario_id, organizacion_id, title, message, scheduled_for, is_recurring, recurrence_pattern, is_active, created_at)
VALUES
    (@USUARIO_ID, @ORGANIZACION_ID,
        'Importar movimientos desde Excel',
        'Importar los movimientos del Excel semanal y revisar las categorías generadas.',
        DATE_ADD(NOW(), INTERVAL 7 DAY),
        TRUE,
        'WEEKLY',
        TRUE,
        NOW());

-- =====================================================================
-- Recordatorio: Importación desde Mercado Pago
-- =====================================================================
INSERT INTO custom_reminders
    (usuario_id, organizacion_id, title, message, scheduled_for, is_recurring, recurrence_pattern, is_active, created_at)
VALUES
    (@USUARIO_ID, @ORGANIZACION_ID,
        'Actualizar movimientos de Mercado Pago',
        'Actualizar movimientos de la cuenta de Mercado Pago asociada a MyCFO SRL.',
        DATE_ADD(NOW(), INTERVAL 5 DAY),
        TRUE,
        'WEEKLY',
        TRUE,
        NOW());
