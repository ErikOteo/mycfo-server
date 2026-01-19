-- ============================================================
-- PRESUPUESTO AUTOMÁTICO 2025
-- Actualizado con movimientos de Enero, Marzo, Abril, Julio, Noviembre y Diciembre
-- ============================================================
-- Ajustar estos valores antes de ejecutar si es necesario
SET @ORGANIZACION_ID := 1;
SET @USUARIO_ID   := '732c0a7a-80e1-70e6-d07b-1a1d0ee2be76';

USE pronostico_db;

-- 🔹 Presupuesto principal
INSERT INTO presupuesto (id, nombre, desde, hasta, created_at, deleted, deleted_at, deleted_by, owner_sub, organizacion_id)
VALUES
(3, 'Presupuesto 2025', '2025-01-01', '2025-12-31', NOW(), false, NULL, NULL, @USUARIO_ID, @ORGANIZACION_ID)
AS new_values
ON DUPLICATE KEY UPDATE
  nombre = new_values.nombre,
  desde = new_values.desde,
  hasta = new_values.hasta,
  deleted = false,
  deleted_at = NULL,
  deleted_by = NULL;

-- 🔹 Líneas de presupuesto 2025
INSERT INTO presupuesto_linea (presupuesto_id, mes, categoria, tipo, monto_estimado, monto_real, source_type, source_id, created_at, updated_at)
VALUES
-- 🔸 Enero
(3, '2025-01-01', 'Mantenimiento', 'INGRESO', 420350.06, 420350.06, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-01-01', 'Licencias', 'INGRESO', 29290.32, 29290.32, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-01-01', 'Suscripciones', 'INGRESO', 100132.27, 100132.27, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-01-01', 'Nomina', 'EGRESO', 87002.07, 87002.07, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-01-01', 'Logistica', 'EGRESO', 208379.26, 208379.26, 'MANUAL', NULL, NOW(), NOW()),

-- 🔸 Febrero
(3, '2025-02-01', 'Suscripciones', 'INGRESO', 179444.51, 179444.51, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-02-01', 'Logistica', 'EGRESO', 459112.20, 459112.20, 'MANUAL', NULL, NOW(), NOW()),

-- 🔸 Marzo
(3, '2025-03-01', 'Nomina', 'EGRESO', 64972.03, 64972.03, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-03-01', 'Servicios Tercerizados', 'EGRESO', 101073.11, 101073.11, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-03-01', 'Impuestos', 'EGRESO', 79624.40, 79624.40, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-03-01', 'Logistica', 'EGRESO', 64698.35, 64698.35, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-03-01', 'Consultoria', 'INGRESO', 465769.26, 465769.26, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-03-01', 'Mantenimiento', 'INGRESO', 336370.08, 336370.08, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-03-01', 'Suscripciones', 'INGRESO', 183380.49, 183380.49, 'MANUAL', NULL, NOW(), NOW()),

-- 🔸 Abril
(3, '2025-04-01', 'Suscripciones', 'INGRESO', 134965.29, 134965.29, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-04-01', 'Alquileres', 'INGRESO', 560240.41, 560240.41, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-04-01', 'Infraestructura', 'EGRESO', 57292.61, 57292.61, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-04-01', 'Servicios Tercerizados', 'EGRESO', 794926.11, 794926.11, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-04-01', 'Mantenimiento', 'EGRESO', 318249.78, 318249.78, 'MANUAL', NULL, NOW(), NOW()),

-- 🔸 Mayo a Junio
(3, '2025-05-01', 'Ventas Mayoristas', 'INGRESO', 370582.82, 370582.82, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-05-01', 'Mantenimiento', 'EGRESO', 485565.26, 485565.26, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-06-01', 'Infraestructura', 'EGRESO', 424081.11, 424081.11, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-06-01', 'Servicios Profesionales', 'INGRESO', 117632.13, 117632.13, 'MANUAL', NULL, NOW(), NOW()),

-- 🔸 Julio
(3, '2025-07-01', 'Infraestructura', 'EGRESO', 576138.66, 576138.66, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-07-01', 'Impuestos', 'EGRESO', 213575.77, 213575.77, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-07-01', 'Mantenimiento', 'EGRESO', 363940.82, 363940.82, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-07-01', 'Servicios Tercerizados', 'EGRESO', 440373.02, 440373.02, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-07-01', 'Compras', 'EGRESO', 31537.30, 31537.30, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-07-01', 'Licencias', 'INGRESO', 175193.56, 175193.56, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-07-01', 'Ventas Mayoristas', 'INGRESO', 12025.87, 12025.87, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-07-01', 'Suscripciones', 'INGRESO', 350591.48, 350591.48, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-07-01', 'Soporte', 'INGRESO', 702568.36, 702568.36, 'MANUAL', NULL, NOW(), NOW()),

-- 🔸 Noviembre
(3, '2025-11-01', 'Licencias', 'INGRESO', 479538.99, 479538.99, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-11-01', 'Servicios Profesionales', 'INGRESO', 657648.35, 657648.35, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-11-01', 'Mantenimiento', 'INGRESO', 231635.06, 231635.06, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-11-01', 'Nomina', 'EGRESO', 468418.04, 468418.04, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-11-01', 'Mantenimiento', 'EGRESO', 831021.35, 831021.35, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-11-01', 'Compras', 'EGRESO', 232209.24, 232209.24, 'MANUAL', NULL, NOW(), NOW()),

-- 🔸 Diciembre (nuevos movimientos)
(3, '2025-12-01', 'Licencias', 'INGRESO', 382915.77, 382915.77, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-12-01', 'Ventas Mayoristas', 'INGRESO', 204856.44, 204856.44, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-12-01', 'Suscripciones', 'INGRESO', 256380.12, 256380.12, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-12-01', 'Servicios Profesionales', 'INGRESO', 498234.90, 498234.90, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-12-01', 'Nomina', 'EGRESO', 503218.66, 503218.66, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-12-01', 'Mantenimiento', 'EGRESO', 417092.84, 417092.84, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-12-01', 'Compras', 'EGRESO', 184501.37, 184501.37, 'MANUAL', NULL, NOW(), NOW()),
(3, '2025-12-01', 'Infraestructura', 'EGRESO', 293647.58, 293647.58, 'MANUAL', NULL, NOW(), NOW());

-- ============================================================
-- FIN PRESUPUESTO 2025 (Versión final con Diciembre)
-- ============================================================