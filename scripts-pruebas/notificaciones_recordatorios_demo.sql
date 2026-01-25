-- Bulk insert de notificaciones y recordatorios demo para MyCFO
-- Ajustar estos valores antes de ejecutar si es necesario
SET @ORGANIZACION_ID := 2;
SET @USUARIO_ID   := '73fc2afa-c031-705e-2ed0-cad82d5e5619';

-- Preferencias de notificación para el usuario demo
INSERT INTO notification_preferences
    (organizacion_id, usuario_id, email_enabled, in_app_enabled, push_enabled,
     daily_digest_enabled, weekly_digest_enabled, digest_time, user_email)
VALUES
    (@ORGANIZACION_ID, @USUARIO_ID, TRUE, TRUE, FALSE, TRUE, TRUE, '09:00:00', 'founder@mycfo.com')
ON DUPLICATE KEY UPDATE
    email_enabled       = VALUES(email_enabled),
    in_app_enabled      = VALUES(in_app_enabled),
    push_enabled        = VALUES(push_enabled),
    daily_digest_enabled = VALUES(daily_digest_enabled),
    weekly_digest_enabled = VALUES(weekly_digest_enabled),
    digest_time         = VALUES(digest_time),
    user_email          = VALUES(user_email);

-- =====================================================================
-- NOTIFICACIONES: actividad diaria de una startup usando MyCFO
-- =====================================================================

-- Día 0 (hoy): actividad reciente
INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@USUARIO_ID, @ORGANIZACION_ID,
    'MOVEMENT_NEW',
    'Nuevo ingreso registrado',
    'Se registró un nuevo ingreso por Prestación de Servicios de $185.000 ARS',
    'INFO',
    'MOVEMENT',
    'mov_2025_001',
    FALSE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'MOVEMENT_NEW',
    'Nuevo egreso cargado',
    'Se cargó un egreso por Compras de Negocio de $92.500 ARS',
    'INFO',
    'MOVEMENT',
    'mov_2025_002',
    FALSE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'MOVEMENT_CATEGORIZED',
    'Movimiento categorizado automáticamente',
    'Un movimiento fue categorizado como "Servicios Financieros" según tu historial',
    'INFO',
    'MOVEMENT',
    'mov_2025_003',
    TRUE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'MOVEMENT_HIGH',
    'Movimiento alto detectado',
    'Se detectó un egreso inusual de $480.000 ARS en Compras de Negocio. Revisá si corresponde a una inversión puntual.',
    'WARN',
    'MOVEMENT',
    'mov_2025_004',
    FALSE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'BUDGET_WARNING',
    'Presupuesto de Marketing al 85%',
    'El presupuesto mensual de "Marketing" alcanzó el 85% de su límite. Evaluá frenar campañas o ajustar el presupuesto.',
    'INFO',
    'BUDGET',
    'budget_marketing_2025_10',
    FALSE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'BUDGET_EXCEEDED',
    'Presupuesto de Tecnología excedido',
    'El presupuesto de "Compras de Negocio - Tecnología" se excedió en $35.000 ARS frente al límite definido.',
    'WARN',
    'BUDGET',
    'budget_tech_2025_10',
    FALSE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'REPORT_READY',
    'Reporte mensual de septiembre disponible',
    'Tu reporte mensual de septiembre está listo para revisar resultados e indicadores clave.',
    'INFO',
    'REPORT',
    'report_2025_09',
    TRUE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'CASH_FLOW_ALERT',
    'Alerta crítica de Cash Flow',
    'Las proyecciones indican que tu flujo de caja podría ser negativo dentro de 7 días si mantenés el nivel actual de egresos.',
    'CRIT',
    'CASH_FLOW',
    'cf_alert_2025_10',
    FALSE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'DATA_IMPORTED',
    'Importación desde Excel completada',
    'Se importaron 72 movimientos desde tu planilla de Excel y fueron conciliados con tus registros.',
    'INFO',
    'SYSTEM',
    'data_import_excel_001',
    TRUE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'DATA_IMPORTED',
    'Importación desde Mercado Pago completada',
    'Se importaron 25 movimientos desde una cuenta de Mercado Pago y quedaron listos para categorizar.',
    'INFO',
    'SYSTEM',
    'data_import_mp_001',
    FALSE,
    NOW());

-- Notificaciones ligadas a facturación
INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@USUARIO_ID, @ORGANIZACION_ID,
    'REMINDER_DEADLINE',
    'Factura próxima a vencer',
    'La factura 000100000123 por $210.000 ARS vence en 3 días. Revisá si ya se registró el cobro.',
    'WARN',
    'BILL',
    'bill_000100000123',
    FALSE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'REMINDER_BILL_DUE',
    'Factura vencida sin cobro registrado',
    'La factura 000100000098 figura vencida hace 5 días y todavía no tiene movimientos asociados.',
    'WARN',
    'BILL',
    'bill_000100000098',
    FALSE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'REPORT_ANOMALY',
    'Posible inconsistencia en conciliación',
    'Se detectó una diferencia entre el total facturado y los movimientos cobrados para octubre. Revisá la sección de conciliación.',
    'WARN',
    'REPORT',
    'conciliation_2025_10',
    FALSE,
    NOW());

-- Día -1: actividad de ayer
INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@USUARIO_ID, @ORGANIZACION_ID,
    'MOVEMENT_NEW',
    'Ingreso recurrente de suscripción',
    'Se acreditó un ingreso recurrente de $95.000 ARS por Ventas de Productos (plan mensual).',
    'INFO',
    'MOVEMENT',
    'mov_2025_005',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@USUARIO_ID, @ORGANIZACION_ID,
    'MONTHLY_SUMMARY',
    'Resumen diario disponible',
    'Tu resumen de movimientos de ayer ya está disponible en el panel principal.',
    'INFO',
    'REPORT',
    'daily_summary_2025_10_ayer',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@USUARIO_ID, @ORGANIZACION_ID,
    'FORECAST_ALERT',
    'Alerta de pronóstico de ingresos',
    'El pronóstico muestra una caída de ingresos por Prestación de Servicios para el próximo mes si no se suman nuevos clientes.',
    'WARN',
    'SYSTEM',
    'forecast_ingresos_2025_11',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@USUARIO_ID, @ORGANIZACION_ID,
    'BUDGET_CREATED',
    'Nuevo presupuesto creado',
    'Se creó el presupuesto trimestral de "Operaciones" para Q1 2026.',
    'INFO',
    'BUDGET',
    'budget_operaciones_2026_Q1',
    TRUE,
    DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Día -2: acciones ya vistas / menos críticas
INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@USUARIO_ID, @ORGANIZACION_ID,
    'BUDGET_COMPLETED',
    'Presupuesto de Educación cargado',
    'Finalizaste la carga del presupuesto anual en la categoría "Educación" para el equipo.',
    'INFO',
    'BUDGET',
    'budget_educacion_2025',
    TRUE,
    DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@USUARIO_ID, @ORGANIZACION_ID,
    'DATA_EXPORTED',
    'Exportación de datos completada',
    'Se exportaron todos los movimientos del último trimestre a un archivo CSV.',
    'INFO',
    'SYSTEM',
    'export_trimestre_2025_Q3',
    TRUE,
    DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@USUARIO_ID, @ORGANIZACION_ID,
    'USER_INVITED',
    'Nuevo usuario invitado',
    'Se invitó a operaciones@mycfo.com al espacio de trabajo de MyCFO SRL.',
    'INFO',
    'SYSTEM',
    'user_ops_001',
    TRUE,
    DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@USUARIO_ID, @ORGANIZACION_ID,
    'ROLE_CHANGED',
    'Rol actualizado',
    'Tu rol fue actualizado a "Administrador financiero". Ahora podés gestionar usuarios y presupuestos.',
    'INFO',
    'SYSTEM',
    'role_change_admin_finance',
    TRUE,
    DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Día -3 y -4: recordatorios menos recientes
INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@USUARIO_ID, @ORGANIZACION_ID,
    'REMINDER_RECURRING',
    'Recordatorio semanal: revisar gastos',
    'Revisión semanal de gastos en "Compras Personales" y "Ocio y Entretenimiento".',
    'INFO',
    'SYSTEM',
    'rem_semana_gastos',
    TRUE,
    DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@USUARIO_ID, @ORGANIZACION_ID,
    'REMINDER_CUSTOM',
    'Recordatorio: cierre de mes',
    'No olvides revisar y aprobar los movimientos antes del cierre contable del mes.',
    'INFO',
    'SYSTEM',
    'rem_cierre_mes',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@USUARIO_ID, @ORGANIZACION_ID,
    'SYSTEM_MAINTENANCE',
    'Mantenimiento programado de la plataforma',
    'MyCFO estará en mantenimiento el domingo de 02:00 a 04:00 AM (hora local).',
    'INFO',
    'SYSTEM',
    'sys_mantenimiento_001',
    TRUE,
    DATE_SUB(NOW(), INTERVAL 4 DAY));

-- =====================================================================
-- RECORDATORIOS PERSONALIZADOS (custom_reminders)
-- =====================================================================
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
