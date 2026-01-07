-- ============================================================
-- PRESUPUESTO AUTOMÁTICO 2025 (Basado en movimientos reales)
-- ============================================================

USE pronostico_db;

INSERT INTO presupuesto (id, nombre, desde, hasta, created_at, deleted, deleted_at, deleted_by, owner_sub, organizacion_id)
VALUES
(2, 'Presupuesto 2025', '2025-01-01', '2025-12-31', NOW(), false, NULL, NULL,
 '136cda9a-e0d1-7005-14e6-27a2f765e0be', 1)
AS new_values
ON DUPLICATE KEY UPDATE
  nombre = new_values.nombre,
  desde = new_values.desde,
  hasta = new_values.hasta,
  deleted = false,
  deleted_at = NULL,
  deleted_by = NULL;

-- ============================================================
-- LÍNEAS DE PRESUPUESTO 2025
-- ============================================================

INSERT INTO presupuesto_linea
(presupuesto_id, mes, categoria, tipo, monto_estimado, monto_real, source_type, source_id, created_at, updated_at)
VALUES

-- =======================
-- ENERO 2025
-- =======================
(2,'2025-01-01','Prestación de Servicios','INGRESO',7455680,8104000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-01-01','Ventas de Productos','INGRESO',2599920,2826000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-01-01','Otros Ingresos','INGRESO',2417760,2628000,'MANUAL',NULL,NOW(),NOW()),

(2,'2025-01-01','Vivienda','EGRESO',203040,188000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-01-01','Otros Egresos','EGRESO',432540,400500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-01-01','Compras de Negocio','EGRESO',4705560,4357000,'MANUAL',NULL,NOW(),NOW()),

-- =======================
-- FEBRERO 2025
-- =======================
(2,'2025-02-01','Prestación de Servicios','INGRESO',2633960,2863000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-02-01','Ventas de Productos','INGRESO',4570560,4968000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-02-01','Otros Ingresos','INGRESO',2482900,2707500,'MANUAL',NULL,NOW(),NOW()),

(2,'2025-02-01','Vivienda','EGRESO',203040,188000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-02-01','Otros Egresos','EGRESO',1637820,1516500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-02-01','Compras de Negocio','EGRESO',2336580,2163500,'MANUAL',NULL,NOW(),NOW()),

-- =======================
-- MARZO 2025
-- =======================
(2,'2025-03-01','Prestación de Servicios','INGRESO',5584400,6070000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-03-01','Ventas de Productos','INGRESO',2514360,2733000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-03-01','Otros Ingresos','INGRESO',1282020,1393500,'MANUAL',NULL,NOW(),NOW()),

(2,'2025-03-01','Vivienda','EGRESO',203040,188000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-03-01','Otros Egresos','EGRESO',634500,587500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-03-01','Compras de Negocio','EGRESO',3188980,2943500,'MANUAL',NULL,NOW(),NOW()),

-- =======================
-- ABRIL 2025
-- =======================
(2,'2025-04-01','Prestación de Servicios','INGRESO',5403160,5873000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-04-01','Ventas de Productos','INGRESO',2257680,2454000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-04-01','Otros Ingresos','INGRESO',1172080,1274000,'MANUAL',NULL,NOW(),NOW()),

(2,'2025-04-01','Vivienda','EGRESO',203040,188000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-04-01','Otros Egresos','EGRESO',1205280,1115900,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-04-01','Compras de Negocio','EGRESO',2460240,2278000,'MANUAL',NULL,NOW(),NOW()),

-- =======================
-- MAYO 2025
-- =======================
(2,'2025-05-01','Prestación de Servicios','INGRESO',972900,1057500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-05-01','Ventas de Productos','INGRESO',4071580,4436500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-05-01','Otros Ingresos','INGRESO',1960860,2140500,'MANUAL',NULL,NOW(),NOW()),

(2,'2025-05-01','Vivienda','EGRESO',203040,188000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-05-01','Otros Egresos','EGRESO',961200,890000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-05-01','Compras de Negocio','EGRESO',1938060,1794500,'MANUAL',NULL,NOW(),NOW()),

-- =======================
-- JUNIO 2025
-- =======================
(2,'2025-06-01','Prestación de Servicios','INGRESO',1299960,1413000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-06-01','Ventas de Productos','INGRESO',4453260,4840500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-06-01','Otros Ingresos','INGRESO',399280,434000,'MANUAL',NULL,NOW(),NOW()),

(2,'2025-06-01','Vivienda','EGRESO',203040,188000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-06-01','Otros Egresos','EGRESO',837540,775500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-06-01','Compras de Negocio','EGRESO',1719000,1582500,'MANUAL',NULL,NOW(),NOW()),

-- =======================
-- JULIO 2025
-- =======================
(2,'2025-07-01','Prestación de Servicios','INGRESO',3012540,3274500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-07-01','Ventas de Productos','INGRESO',1911760,2078000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-07-01','Otros Ingresos','INGRESO',771880,839000,'MANUAL',NULL,NOW(),NOW()),

(2,'2025-07-01','Vivienda','EGRESO',212760,197000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-07-01','Otros Egresos','EGRESO',775440,718000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-07-01','Compras de Negocio','EGRESO',1603800,1485000,'MANUAL',NULL,NOW(),NOW()),

-- =======================
-- AGOSTO 2025
-- =======================
(2,'2025-08-01','Prestación de Servicios','INGRESO',2982640,3242000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-08-01','Ventas de Productos','INGRESO',3259100,3542500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-08-01','Otros Ingresos','INGRESO',0,0,'MANUAL',NULL,NOW(),NOW()),

(2,'2025-08-01','Vivienda','EGRESO',212760,197000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-08-01','Otros Egresos','EGRESO',1238220,1146500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-08-01','Compras de Negocio','EGRESO',1266300,1172500,'MANUAL',NULL,NOW(),NOW()),

-- =======================
-- SEPTIEMBRE 2025
-- =======================
(2,'2025-09-01','Prestación de Servicios','INGRESO',5063680,5504000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-09-01','Ventas de Productos','INGRESO',1939360,2108000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-09-01','Otros Ingresos','INGRESO',0,0,'MANUAL',NULL,NOW(),NOW()),

(2,'2025-09-01','Vivienda','EGRESO',212760,197000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-09-01','Otros Egresos','EGRESO',1276020,1181500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-09-01','Compras de Negocio','EGRESO',1674540,1550500,'MANUAL',NULL,NOW(),NOW()),

-- =======================
-- OCTUBRE 2025
-- =======================
(2,'2025-10-01','Prestación de Servicios','INGRESO',4540780,4946500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-10-01','Ventas de Productos','INGRESO',2216740,2409500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-10-01','Otros Ingresos','INGRESO',1568140,1704500,'MANUAL',NULL,NOW(),NOW()),

(2,'2025-10-01','Vivienda','EGRESO',212760,197000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-10-01','Otros Egresos','EGRESO',554580,513500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-10-01','Compras de Negocio','EGRESO',2865780,2653500,'MANUAL',NULL,NOW(),NOW()),

-- =======================
-- NOVIEMBRE 2025
-- =======================
(2,'2025-11-01','Prestación de Servicios','INGRESO',5335080,5799000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-11-01','Ventas de Productos','INGRESO',4594020,4993500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-11-01','Otros Ingresos','INGRESO',1556640,1692000,'MANUAL',NULL,NOW(),NOW()),

(2,'2025-11-01','Vivienda','EGRESO',212760,197000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-11-01','Otros Egresos','EGRESO',788400,730000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-11-01','Compras de Negocio','EGRESO',3899880,3611000,'MANUAL',NULL,NOW(),NOW()),

-- =======================
-- DICIEMBRE 2025
-- =======================
(2,'2025-12-01','Prestación de Servicios','INGRESO',6272560,6818000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-12-01','Ventas de Productos','INGRESO',4049380,4401500,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-12-01','Otros Ingresos','INGRESO',1587460,1725500,'MANUAL',NULL,NOW(),NOW()),

(2,'2025-12-01','Vivienda','EGRESO',212760,197000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-12-01','Otros Egresos','EGRESO',2883600,2670000,'MANUAL',NULL,NOW(),NOW()),
(2,'2025-12-01','Compras de Negocio','EGRESO',1995300,1847500,'MANUAL',NULL,NOW(),NOW());

-- ============================================================
-- FIN PRESUPUESTO 2025
-- ============================================================
