-- ============================================================
-- PRESUPUESTO AUTOMATICO 2026 (USD)
-- Montos estimados a tipo de cambio de referencia: 1 USD = 1500 ARS
-- ============================================================
-- Ajustar estos valores antes de ejecutar si es necesario
SET @ORGANIZACION_ID := 1;
SET @USUARIO_ID   := '335c7a9a-d021-704f-ba63-9c18f37959f8';

USE pronostico_db;

-- Presupuesto principal
INSERT INTO presupuesto (id, nombre, desde, hasta, created_at, deleted, deleted_at, deleted_by, owner_sub, organizacion_id)
VALUES
(5, '[USD] Presupuesto 2026', '2026-01-01', '2026-12-31', NOW(), false, NULL, NULL, @USUARIO_ID, @ORGANIZACION_ID)
AS new_values
ON DUPLICATE KEY UPDATE
  nombre = new_values.nombre,
  desde = new_values.desde,
  hasta = new_values.hasta,
  deleted = false,
  deleted_at = NULL,
  deleted_by = NULL;

-- Lineas de presupuesto 2026 (montos en USD)
INSERT INTO presupuesto_linea (presupuesto_id, mes, categoria, tipo, monto_estimado, monto_real, source_type, source_id, created_at, updated_at)
VALUES
-- Enero
(5, '2026-01-01', 'Consultoria Internacional', 'INGRESO', 17150.00, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-01-01', 'Licencias de Software', 'EGRESO', 5630.00, NULL, 'MANUAL', NULL, NOW(), NOW()),

-- Febrero
(5, '2026-02-01', 'Servicios Financieros', 'INGRESO', 22900.00, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-02-01', 'Consultoria Internacional', 'INGRESO', 16350.00, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-02-01', 'Viajes y Viaticos', 'EGRESO', 8450.00, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-02-01', 'Publicidad Internacional', 'EGRESO', 7420.00, NULL, 'MANUAL', NULL, NOW(), NOW()),

-- Marzo
(5, '2026-03-01', 'Consultoria', 'INGRESO', 413.33, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-03-01', 'Servicios Profesionales', 'INGRESO', 186.67, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-03-01', 'Servicios Tercerizados', 'EGRESO', 206.67, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-03-01', 'Impuestos', 'EGRESO', 120.00, NULL, 'MANUAL', NULL, NOW(), NOW()),

-- Abril
(5, '2026-04-01', 'Suscripciones', 'INGRESO', 293.33, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-04-01', 'Alquileres', 'INGRESO', 173.33, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-04-01', 'Mantenimiento', 'EGRESO', 146.67, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-04-01', 'Infraestructura', 'EGRESO', 156.67, NULL, 'MANUAL', NULL, NOW(), NOW()),

-- Mayo
(5, '2026-05-01', 'Soporte', 'INGRESO', 273.33, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-05-01', 'Ventas Mayoristas', 'INGRESO', 333.33, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-05-01', 'Nomina', 'EGRESO', 370.00, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-05-01', 'Compras', 'EGRESO', 140.00, NULL, 'MANUAL', NULL, NOW(), NOW()),

-- Junio
(5, '2026-06-01', 'Licencias', 'INGRESO', 146.67, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-06-01', 'Servicios Profesionales', 'INGRESO', 216.67, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-06-01', 'Servicios Tercerizados', 'EGRESO', 196.67, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-06-01', 'Logistica', 'EGRESO', 166.67, NULL, 'MANUAL', NULL, NOW(), NOW()),

-- Julio
(5, '2026-07-01', 'Consultoria', 'INGRESO', 433.33, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-07-01', 'Suscripciones', 'INGRESO', 303.33, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-07-01', 'Nomina', 'EGRESO', 386.67, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-07-01', 'Mantenimiento', 'EGRESO', 160.00, NULL, 'MANUAL', NULL, NOW(), NOW()),

-- Agosto
(5, '2026-08-01', 'Soporte', 'INGRESO', 286.67, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-08-01', 'Ventas Mayoristas', 'INGRESO', 346.67, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-08-01', 'Infraestructura', 'EGRESO', 163.33, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-08-01', 'Impuestos', 'EGRESO', 126.67, NULL, 'MANUAL', NULL, NOW(), NOW()),

-- Septiembre
(5, '2026-09-01', 'Suscripciones', 'INGRESO', 313.33, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-09-01', 'Servicios Profesionales', 'INGRESO', 226.67, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-09-01', 'Nomina', 'EGRESO', 400.00, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-09-01', 'Compras', 'EGRESO', 150.00, NULL, 'MANUAL', NULL, NOW(), NOW()),

-- Octubre
(5, '2026-10-01', 'Licencias', 'INGRESO', 160.00, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-10-01', 'Mantenimiento', 'INGRESO', 120.00, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-10-01', 'Servicios Tercerizados', 'EGRESO', 203.33, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-10-01', 'Logistica', 'EGRESO', 173.33, NULL, 'MANUAL', NULL, NOW(), NOW()),

-- Noviembre
(5, '2026-11-01', 'Consultoria', 'INGRESO', 466.67, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-11-01', 'Soporte', 'INGRESO', 300.00, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-11-01', 'Nomina', 'EGRESO', 413.33, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-11-01', 'Infraestructura', 'EGRESO', 170.00, NULL, 'MANUAL', NULL, NOW(), NOW()),

-- Diciembre
(5, '2026-12-01', 'Suscripciones', 'INGRESO', 326.67, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-12-01', 'Ventas Mayoristas', 'INGRESO', 360.00, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-12-01', 'Mantenimiento', 'EGRESO', 173.33, NULL, 'MANUAL', NULL, NOW(), NOW()),
(5, '2026-12-01', 'Compras', 'EGRESO', 160.00, NULL, 'MANUAL', NULL, NOW(), NOW());

-- ============================================================
-- FIN PRESUPUESTO 2026 (USD)
-- ============================================================
