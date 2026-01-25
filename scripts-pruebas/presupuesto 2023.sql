-- ============================================================
-- PRESUPUESTO AUTOMÁTICO 2023 (Basado en movimientos reales)
-- ============================================================
-- Ajustar estos valores antes de ejecutar si es necesario
SET @ORGANIZACION_ID := 2;
SET @USUARIO_ID   := '73fc2afa-c031-705e-2ed0-cad82d5e5619';

USE pronostico_db;

-- 🔹 Presupuesto principal
INSERT INTO presupuesto (id, nombre, desde, hasta, created_at, deleted, deleted_at, deleted_by, owner_sub, organizacion_id)
VALUES
(1, 'Presupuesto 2023', '2023-01-01', '2023-12-31', NOW(), false, NULL, NULL, @USUARIO_ID, @ORGANIZACION_ID)
AS new_values
ON DUPLICATE KEY UPDATE
  nombre = new_values.nombre,
  desde = new_values.desde,
  hasta = new_values.hasta,
  deleted = false,
  deleted_at = NULL,
  deleted_by = NULL;

-- 🔹 Líneas de presupuesto 2023
INSERT INTO presupuesto_linea (presupuesto_id, mes, categoria, tipo, monto_estimado, monto_real, source_type, source_id, created_at, updated_at)
VALUES
(1, '2023-01-01', 'Suscripciones', 'INGRESO', 465594.96, 465594.96, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-03-01', 'Consultoria', 'INGRESO', 430767.22, 430767.22, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-03-01', 'Mantenimiento', 'EGRESO', 287957.56, 287957.56, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-04-01', 'Nomina', 'EGRESO', 78101.53, 78101.53, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-04-01', 'Soporte', 'INGRESO', 14168.79, 14168.79, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-04-01', 'Infraestructura', 'EGRESO', 22997.51, 22997.51, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-07-01', 'Mantenimiento', 'INGRESO', 292836.75, 292836.75, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-07-01', 'Alquileres', 'INGRESO', 443023.37, 443023.37, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-08-01', 'Servicios Tercerizados', 'EGRESO', 133781.06, 133781.06, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-09-01', 'Compras', 'EGRESO', 362676.79, 362676.79, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-10-01', 'Suscripciones', 'INGRESO', 45958.41, 45958.41, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-10-01', 'Alquileres', 'INGRESO', 200912.62, 200912.62, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-11-01', 'Consultoria', 'INGRESO', 463693.04, 463693.04, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-11-01', 'Servicios Profesionales', 'INGRESO', 288014.80, 288014.80, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-12-01', 'Mantenimiento', 'EGRESO', 393247.31, 393247.31, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-12-01', 'Servicios Tercerizados', 'EGRESO', 133781.06, 133781.06, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-12-01', 'Soporte', 'INGRESO', 222780.88, 222780.88, 'MANUAL', NULL, NOW(), NOW()),
(1, '2023-12-01', 'Nomina', 'EGRESO', 354358.50, 354358.50, 'MANUAL', NULL, NOW(), NOW());

-- ============================================================
-- FIN PRESUPUESTO 2023
-- ============================================================
