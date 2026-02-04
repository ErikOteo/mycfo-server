SET @ORGANIZACION_ID := 1;
SET @USUARIO_ID   := '335c7a9a-d021-704f-ba63-9c18f37959f8';

-- Preferencias de notificación para el usuario demo
INSERT INTO notification_preferences
    (organizacion_id, usuario_id, email_enabled, in_app_enabled, push_enabled,
     daily_digest_enabled, weekly_digest_enabled, digest_time, user_email)
VALUES
    (@ORGANIZACION_ID, @USUARIO_ID, TRUE, TRUE, FALSE, TRUE, TRUE, '09:00:00', 'founder@mycfo.com')
ON DUPLICATE KEY UPDATE
    email_enabled        = VALUES(email_enabled),
    in_app_enabled       = VALUES(in_app_enabled),
    push_enabled         = VALUES(push_enabled),
    daily_digest_enabled = VALUES(daily_digest_enabled),
    weekly_digest_enabled = VALUES(weekly_digest_enabled),
    digest_time          = VALUES(digest_time),
    user_email           = VALUES(user_email);

-- =====================================================================
-- NOTIFICACIONES: dataset base alineado a los tipos vigentes en MyCFO
-- (se replica la forma en que las genera EventService para cada tipo)
-- =====================================================================

-- Día 0 (hoy)
INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@USUARIO_ID, @ORGANIZACION_ID,
    'REMINDER_CUSTOM',
    'Recordatorios',
    'Tienes recordatorios activos para esta semana en tu panel.',
    'INFO',
    'SYSTEM',
    'reminders_seed_001',
    FALSE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'MOVEMENT_HIGH',
    'Movimiento alto detectado',
    'Pago a Proveedores - $480.000 ARS',
    'WARN',
    'MOVEMENT',
    'mov_high_seed_001',
    FALSE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'MOVEMENT_IMPORT',
    'Importación de movimientos',
    'Fuente: Mercado Pago | Registros: 25',
    'INFO',
    'MOVEMENT',
    'import_mp_seed_001',
    FALSE,
    NOW()),
(@USUARIO_ID, @ORGANIZACION_ID,
    'ACCOUNT_MP_LINKED',
    'Cuenta vinculada a Mercado Pago',
    'Cuenta: Mercado Pago - Caja',
    'INFO',
    'SYSTEM',
    'mp_account_seed_001',
    FALSE,
    NOW());

-- Día -1
INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@USUARIO_ID, @ORGANIZACION_ID,
    'BUDGET_CREATED',
    'Presupuesto creado',
    'Se creo el presupuesto Marketing (Oct 2025)',
    'INFO',
    'BUDGET',
    'budget_seed_mkt_2025_10',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@USUARIO_ID, @ORGANIZACION_ID,
    'BUDGET_DELETED',
    'Presupuesto eliminado',
    'Se elimino el presupuesto Viajes (2025)',
    'WARN',
    'BUDGET',
    'budget_seed_viajes_2025',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Día -2
INSERT INTO notifications
    (usuario_id, organizacion_id, type, title, body, severity, resource_type, resource_id, is_read, created_at)
VALUES
(@USUARIO_ID, @ORGANIZACION_ID,
    'REPORT_READY',
    'Reporte generado: Flujo de Fondos',
    'Tipo: CASH_FLOW | Periodo: 2025-Q3',
    'INFO',
    'REPORT',
    'report_cf_2025_Q3',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@USUARIO_ID, @ORGANIZACION_ID,
    'MONTHLY_SUMMARY',
    'Resumen Mensual Listo',
    'Tipo: MONTHLY_SUMMARY | Periodo: 2025-10',
    'INFO',
    'REPORT',
    'report_monthly_2025_10',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 2 DAY));
