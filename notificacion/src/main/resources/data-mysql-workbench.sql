-- Script para MySQL Workbench - Notificaciones multi-tenant

ALTER TABLE notifications
    MODIFY COLUMN id BIGINT AUTO_INCREMENT PRIMARY KEY;

SET @demo_user := '13cc9afa-b0e1-709a-813c-17316f2eb93d';
SET @demo_org := 1;

INSERT INTO notification_preferences
    (organizacion_id, usuario_id, email_enabled, in_app_enabled, push_enabled,
     daily_digest_enabled, weekly_digest_enabled, digest_time, user_email)
VALUES
    (@demo_org, @demo_user, true, true, false, true, true, '09:00:00', 'mycfoarg@gmail.com')
ON DUPLICATE KEY UPDATE email_enabled = VALUES(email_enabled);

INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@demo_user, @demo_org, 'MOVEMENT_NEW', 'Nuevo ingreso detectado', 'Se detecto un nuevo ingreso de $150,000 en tu cuenta bancaria', 'INFO', 'MOVEMENT', 'mov_001', false, NOW()),
(@demo_user, @demo_org, 'MOVEMENT_HIGH', 'Movimiento alto detectado', 'Se detecto un movimiento alto de $500,000 - revisar origen', 'WARN', 'MOVEMENT', 'mov_002', false, NOW()),
(@demo_user, @demo_org, 'BUDGET_EXCEEDED', 'Presupuesto de Marketing excedido', 'El presupuesto de "Marketing" se ha excedido en $15,000', 'WARN', 'BUDGET', 'budget_001', false, NOW()),
(@demo_user, @demo_org, 'BUDGET_WARNING', 'Presupuesto de Ventas al 90%', 'El presupuesto de "Ventas" esta al 90% de su limite', 'INFO', 'BUDGET', 'budget_002', false, NOW()),
(@demo_user, @demo_org, 'CASH_FLOW_ALERT', 'Alerta critica de Cash Flow', 'Tu balance proyectado sera negativo en 5 dias', 'CRIT', 'CASH_FLOW', 'cf_001', false, NOW()),
(@demo_user, @demo_org, 'REPORT_READY', 'Reporte mensual listo', 'Tu reporte mensual de enero esta disponible para descargar', 'INFO', 'REPORT', 'report_001', true, NOW()),
(@demo_user, @demo_org, 'REPORT_ANOMALY', 'Anomalia en reporte detectada', 'Se detecto una anomalia en el reporte de gastos', 'WARN', 'REPORT', 'report_002', false, NOW()),
(@demo_user, @demo_org, 'REMINDER_CUSTOM', 'Recordatorio: Vencimiento de monotributo', 'No olvides pagar el monotributo antes del 20 de febrero', 'INFO', 'SYSTEM', 'rem_001', false, NOW()),
(@demo_user, @demo_org, 'REMINDER_DEADLINE', 'Vencimiento proximo: Factura 001', 'La factura 001 vence en 3 dias', 'WARN', 'SYSTEM', 'rem_002', false, NOW()),
(@demo_user, @demo_org, 'SYSTEM_MAINTENANCE', 'Mantenimiento programado', 'El sistema estara en mantenimiento el domingo de 2:00 a 4:00 AM', 'INFO', 'SYSTEM', 'sys_001', true, NOW());

INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@demo_user, @demo_org, 'MOVEMENT_NEW', 'Ingreso de ayer', 'Se detecto un ingreso de $75,000 ayer', 'INFO', 'MOVEMENT', 'mov_003', false, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@demo_user, @demo_org, 'BUDGET_CREATED', 'Nuevo presupuesto creado', 'Se creo el presupuesto "Desarrollo" para Q1', 'INFO', 'BUDGET', 'budget_003', false, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@demo_user, @demo_org, 'FORECAST_ALERT', 'Alerta de pronostico', 'El pronostico indica una tendencia negativa', 'WARN', 'SYSTEM', 'forecast_001', false, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@demo_user, @demo_org, 'DATA_IMPORTED', 'Datos importados exitosamente', 'Se importaron 150 movimientos desde el banco', 'INFO', 'SYSTEM', 'data_001', true, DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@demo_user, @demo_org, 'MOVEMENT_CATEGORIZED', 'Movimiento categorizado', 'Se categorizo automaticamente un movimiento como "Alimentacion"', 'INFO', 'MOVEMENT', 'mov_004', true, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@demo_user, @demo_org, 'BUDGET_COMPLETED', 'Presupuesto completado', 'El presupuesto "Marketing" se completo exitosamente', 'INFO', 'BUDGET', 'budget_004', true, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@demo_user, @demo_org, 'MONTHLY_SUMMARY', 'Resumen mensual disponible', 'Tu resumen mensual de enero esta listo', 'INFO', 'REPORT', 'summary_001', false, DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@demo_user, @demo_org, 'REMINDER_RECURRING', 'Recordatorio recurrente', 'Recordatorio semanal: Revisar gastos', 'INFO', 'SYSTEM', 'rem_003', true, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@demo_user, @demo_org, 'USER_INVITED', 'Usuario invitado', 'Se invito a juan@empresa.com al proyecto', 'INFO', 'SYSTEM', 'user_001', true, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@demo_user, @demo_org, 'ROLE_CHANGED', 'Rol actualizado', 'Tu rol fue actualizado a "Administrador"', 'INFO', 'SYSTEM', 'user_002', true, DATE_SUB(NOW(), INTERVAL 3 DAY));

INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@demo_user, @demo_org, 'DATA_EXPORTED', 'Datos exportados', 'Se exportaron los datos del mes de enero', 'INFO', 'SYSTEM', 'data_002', true, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(@demo_user, @demo_org, 'REMINDER_BILL_DUE', 'Factura proxima a vencer', 'La factura 002 vence en 2 dias', 'WARN', 'BILL', 'rem_004', false, DATE_SUB(NOW(), INTERVAL 4 DAY));

INSERT INTO custom_reminders
    (usuario_id, organizacion_id, title, message, scheduled_for, is_recurring, recurrence_pattern, is_active, created_at)
VALUES
(@demo_user, @demo_org, 'Vencimiento de monotributo', 'Recordatorio para pagar el monotributo mensual', DATE_ADD(NOW(), INTERVAL 1 DAY), true, 'MONTHLY', true, NOW()),
(@demo_user, @demo_org, 'Carga de datos semanal', 'No olvides cargar los movimientos de la semana', DATE_ADD(NOW(), INTERVAL 7 DAY), true, 'WEEKLY', true, NOW()),
(@demo_user, @demo_org, 'Revision de presupuestos', 'Revisa y ajusta tus presupuestos mensuales', DATE_ADD(NOW(), INTERVAL 15 DAY), false, NULL, true, NOW());
