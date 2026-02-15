-- ============================================================
-- PRESUPUESTO AUTOMÁTICO 2024 (Basado en movimientos reales)
-- ============================================================
-- Ajustar estos valores antes de ejecutar si es necesario
SET @ORGANIZACION_ID := 1;
SET @USUARIO_ID   := '335c7a9a-d021-704f-ba63-9c18f37959f8';

USE pronostico_db;

-- 🔹 Presupuesto principal
INSERT INTO presupuesto (id, nombre, desde, hasta, created_at, deleted, deleted_at, deleted_by, owner_sub, organizacion_id)
VALUES
(2, 'Presupuesto 2024', '2024-01-01', '2024-12-31', NOW(), false, NULL, NULL, @USUARIO_ID , @ORGANIZACION_ID)
AS new_values
ON DUPLICATE KEY UPDATE
  nombre = new_values.nombre,
  desde = new_values.desde,
  hasta = new_values.hasta,
  deleted = false,
  deleted_at = NULL,
  deleted_by = NULL;

-- 🔹 Líneas de presupuesto 2024
INSERT INTO presupuesto_linea (presupuesto_id, mes, categoria, tipo, monto_estimado, monto_real, source_type, source_id, created_at, updated_at)
VALUES
(2, '2024-01-01', 'Infraestructura', 'EGRESO', 271176.55, 271176.55, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-01-01', 'Consultoria', 'INGRESO', 26275.55, 26275.55, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-01-01', 'Leasing', 'EGRESO', 76425.93, 76425.93, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-03-01', 'Servicios Profesionales', 'INGRESO', 136497.66, 136497.66, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-03-01', 'Logistica', 'EGRESO', 68116.53, 68116.53, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-05-01', 'Nomina', 'EGRESO', 353350.35, 353350.35, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-05-01', 'Servicios Tercerizados', 'EGRESO', 32219.93, 32219.93, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-05-01', 'Suscripciones', 'INGRESO', 439867.54, 439867.54, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-08-01', 'Nomina', 'EGRESO', 133462.34, 133462.34, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-09-01', 'Nomina', 'EGRESO', 272365.37, 272365.37, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-09-01', 'Compras', 'EGRESO', 277342.57, 277342.57, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-09-01', 'Logistica', 'EGRESO', 450579.82, 450579.82, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-09-01', 'Mantenimiento', 'EGRESO', 277342.57, 277342.57, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-10-01', 'Alquileres', 'INGRESO', 245903.15, 245903.15, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-10-01', 'Soporte', 'INGRESO', 193512.41, 193512.41, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-10-01', 'Mantenimiento', 'INGRESO', 120945.25, 120945.25, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-11-01', 'Nomina', 'EGRESO', 181056.57, 181056.57, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-11-01', 'Suscripciones', 'INGRESO', 197847.28, 197847.28, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-12-01', 'Consultoria', 'INGRESO', 193512.41, 193512.41, 'MANUAL', NULL, NOW(), NOW()),
(2, '2024-12-01', 'Mantenimiento', 'EGRESO', 393247.31, 393247.31, 'MANUAL', NULL, NOW(), NOW());

-- ============================================================
-- FIN PRESUPUESTO 2024
-- ============================================================