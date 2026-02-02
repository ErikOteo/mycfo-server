-- ============================================================
-- PRESUPUESTO AUTOMATICO 2026 (ARS)
-- Generado como demo a partir de los presupuestos 2024 y 2025
-- ============================================================
-- Ajustar estos valores antes de ejecutar si es necesario
SET @ORGANIZACION_ID := 1;
SET @USUARIO_ID   := '335c7a9a-d021-704f-ba63-9c18f37959f8';

USE pronostico_db;

-- Presupuesto principal
INSERT INTO presupuesto (id, nombre, desde, hasta, created_at, deleted, deleted_at, deleted_by, owner_sub, organizacion_id)
VALUES
(4, 'Presupuesto 2026', '2026-01-01', '2026-12-31', NOW(), false, NULL, NULL, @USUARIO_ID, @ORGANIZACION_ID)
AS new_values
ON DUPLICATE KEY UPDATE
  nombre = new_values.nombre,
  desde = new_values.desde,
  hasta = new_values.hasta,
  deleted = false,
  deleted_at = NULL,
  deleted_by = NULL;

-- Lineas de presupuesto 2026 (montos en ARS)
INSERT INTO presupuesto_linea (presupuesto_id, mes, categoria, tipo, monto_estimado, monto_real, source_type, source_id, created_at, updated_at)
VALUES
-- Enero
(4, '2026-01-01', 'Suscripciones', 'INGRESO', 420000.00, 420000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-01-01', 'Soporte', 'INGRESO', 350000.00, 350000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-01-01', 'Nomina', 'EGRESO', 520000.00, 520000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-01-01', 'Infraestructura', 'EGRESO', 210000.00, 210000.00, 'MANUAL', NULL, NOW(), NOW()),

-- Febrero
(4, '2026-02-01', 'Ventas Mayoristas', 'INGRESO', 480000.00, 480000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-02-01', 'Licencias', 'INGRESO', 190000.00, 190000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-02-01', 'Nomina', 'EGRESO', 540000.00, 540000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-02-01', 'Logistica', 'EGRESO', 230000.00, 230000.00, 'MANUAL', NULL, NOW(), NOW()),

-- Marzo
(4, '2026-03-01', 'Consultoria', 'INGRESO', 620000.00, 620000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-03-01', 'Servicios Profesionales', 'INGRESO', 280000.00, 280000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-03-01', 'Servicios Tercerizados', 'EGRESO', 310000.00, 310000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-03-01', 'Impuestos', 'EGRESO', 180000.00, 180000.00, 'MANUAL', NULL, NOW(), NOW()),

-- Abril
(4, '2026-04-01', 'Suscripciones', 'INGRESO', 440000.00, 440000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-04-01', 'Alquileres', 'INGRESO', 260000.00, 260000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-04-01', 'Mantenimiento', 'EGRESO', 220000.00, 220000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-04-01', 'Infraestructura', 'EGRESO', 235000.00, 235000.00, 'MANUAL', NULL, NOW(), NOW()),

-- Mayo
(4, '2026-05-01', 'Soporte', 'INGRESO', 410000.00, 410000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-05-01', 'Ventas Mayoristas', 'INGRESO', 500000.00, 500000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-05-01', 'Nomina', 'EGRESO', 555000.00, 555000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-05-01', 'Compras', 'EGRESO', 210000.00, 210000.00, 'MANUAL', NULL, NOW(), NOW()),

-- Junio
(4, '2026-06-01', 'Licencias', 'INGRESO', 220000.00, 220000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-06-01', 'Servicios Profesionales', 'INGRESO', 325000.00, 325000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-06-01', 'Servicios Tercerizados', 'EGRESO', 295000.00, 295000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-06-01', 'Logistica', 'EGRESO', 250000.00, 250000.00, 'MANUAL', NULL, NOW(), NOW()),

-- Julio
(4, '2026-07-01', 'Consultoria', 'INGRESO', 650000.00, 650000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-07-01', 'Suscripciones', 'INGRESO', 455000.00, 455000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-07-01', 'Nomina', 'EGRESO', 580000.00, 580000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-07-01', 'Mantenimiento', 'EGRESO', 240000.00, 240000.00, 'MANUAL', NULL, NOW(), NOW()),

-- Agosto
(4, '2026-08-01', 'Soporte', 'INGRESO', 430000.00, 430000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-08-01', 'Ventas Mayoristas', 'INGRESO', 520000.00, 520000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-08-01', 'Infraestructura', 'EGRESO', 245000.00, 245000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-08-01', 'Impuestos', 'EGRESO', 190000.00, 190000.00, 'MANUAL', NULL, NOW(), NOW()),

-- Septiembre
(4, '2026-09-01', 'Suscripciones', 'INGRESO', 470000.00, 470000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-09-01', 'Servicios Profesionales', 'INGRESO', 340000.00, 340000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-09-01', 'Nomina', 'EGRESO', 600000.00, 600000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-09-01', 'Compras', 'EGRESO', 225000.00, 225000.00, 'MANUAL', NULL, NOW(), NOW()),

-- Octubre
(4, '2026-10-01', 'Licencias', 'INGRESO', 240000.00, 240000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-10-01', 'Mantenimiento', 'INGRESO', 180000.00, 180000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-10-01', 'Servicios Tercerizados', 'EGRESO', 305000.00, 305000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-10-01', 'Logistica', 'EGRESO', 260000.00, 260000.00, 'MANUAL', NULL, NOW(), NOW()),

-- Noviembre
(4, '2026-11-01', 'Consultoria', 'INGRESO', 700000.00, 700000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-11-01', 'Soporte', 'INGRESO', 450000.00, 450000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-11-01', 'Nomina', 'EGRESO', 620000.00, 620000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-11-01', 'Infraestructura', 'EGRESO', 255000.00, 255000.00, 'MANUAL', NULL, NOW(), NOW()),

-- Diciembre
(4, '2026-12-01', 'Suscripciones', 'INGRESO', 490000.00, 490000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-12-01', 'Ventas Mayoristas', 'INGRESO', 540000.00, 540000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-12-01', 'Mantenimiento', 'EGRESO', 260000.00, 260000.00, 'MANUAL', NULL, NOW(), NOW()),
(4, '2026-12-01', 'Compras', 'EGRESO', 240000.00, 240000.00, 'MANUAL', NULL, NOW(), NOW());

-- ============================================================
-- FIN PRESUPUESTO 2026 (ARS)
-- ============================================================
