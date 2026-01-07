-- ============================================================================
-- SCRIPTS DE DATOS DE PRUEBA PARA MÓDULO DE CONCILIACIÓN
-- ============================================================================
-- ============================================================================
-- 1. FACTURAS CON SUS ITEMS (10 facturas completas)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- FACTURA 1: Proveedor ABC - $12,500
-- ---------------------------------------------------------------------------

-- 1.1. Insertar en documento_comercial (tabla padre)
INSERT INTO documento_comercial (
    id_documento,
    tipo_documento,
    numero_documento,
    fecha_emision,
    monto_total,
    moneda,
    categoria,
    version_documento,
    fecha_creacion,
    fecha_actualizacion
) VALUES (
    1,
    'FACTURA',
    '0001-00000001',
    '2025-10-15',
    12500.00,
    'ARS',
    'Compras',
    'ORIGINAL',
    '2025-10-15',
    '2025-10-15'
);

-- 1.2. Insertar en factura (tabla hija)
INSERT INTO factura (
    id_documento,
    tipo_factura,
    vendedor_nombre,
    vendedor_cuit,
    vendedor_condicioniva,
    vendedor_domicilio,
    comprador_nombre,
    comprador_cuit,
    comprador_condicioniva,
    comprador_domicilio,
    cae,
    vencimiento_cae
) VALUES (
    1,
    'A',
    'Proveedor ABC S.A.',
    '30-12345678-9',
    'Responsable Inscripto',
    'Av. Corrientes 1234, CABA',
    'Mi Empresa S.A.',
    '30-98765432-1',
    'Responsable Inscripto',
    'Av. Santa Fe 5678, CABA',
    '75123456789012',
    '2025-10-25'
);

-- 1.3. Insertar items de la factura
INSERT INTO item_factura (cantidad, descripcion, precio_unitario, subtotal_sin_iva, alicuota_iva, monto_total_item, factura_id)
VALUES (10, 'Producto A', 1000.00, 10000.00, 21.0, 12100.00, 1);

INSERT INTO item_factura (cantidad, descripcion, precio_unitario, subtotal_sin_iva, alicuota_iva, monto_total_item, factura_id)
VALUES (5, 'Producto B', 80.00, 400.00, 21.0, 484.00, 1);

-- ---------------------------------------------------------------------------
-- FACTURA 2: Materiales del Sur - $5,000
-- ---------------------------------------------------------------------------

INSERT INTO documento_comercial (
    id_documento, tipo_documento, numero_documento, fecha_emision, monto_total,
    moneda, categoria, version_documento,
    fecha_creacion, fecha_actualizacion
) VALUES (
    2, 'FACTURA', '0001-00000002', '2025-10-12', 5000.00,
    'ARS', 'Servicios', 'ORIGINAL',
    '2025-10-12', '2025-10-12'
);

INSERT INTO factura (
    id_documento, tipo_factura, vendedor_nombre, vendedor_cuit, vendedor_condicioniva,
    comprador_nombre, comprador_cuit, comprador_condicioniva,
    cae, vencimiento_cae
) VALUES (
    2, 'B', 'Materiales del Sur', '27-11223344-5', 'Monotributo',
    'Mi Empresa S.A.', '30-98765432-1', 'Responsable Inscripto',
    '75223456789013', '2025-10-22'
);

INSERT INTO item_factura (cantidad, descripcion, precio_unitario, subtotal_sin_iva, alicuota_iva, monto_total_item, factura_id)
VALUES (20, 'Cemento bolsa 50kg', 250.00, 5000.00, 0.0, 5000.00, 2);

-- ---------------------------------------------------------------------------
-- FACTURA 3: Cliente XYZ (venta) - $45,000
-- ---------------------------------------------------------------------------

INSERT INTO documento_comercial (
    id_documento, tipo_documento, numero_documento, fecha_emision, monto_total,
    moneda, categoria, version_documento,
    fecha_creacion, fecha_actualizacion
) VALUES (
    3, 'FACTURA', '0001-00000003', '2025-10-20', 45000.00,
    'ARS', 'Ventas', 'ORIGINAL',
    '2025-10-20', '2025-10-20'
);

INSERT INTO factura (
    id_documento, tipo_factura, vendedor_nombre, vendedor_cuit, vendedor_condicioniva,
    comprador_nombre, comprador_cuit, comprador_condicioniva,
    cae, vencimiento_cae
) VALUES (
    3, 'A', 'Mi Empresa S.A.', '30-98765432-1', 'Responsable Inscripto',
    'Cliente XYZ S.R.L.', '30-55667788-9', 'Responsable Inscripto',
    '75323456789014', '2025-10-30'
);

INSERT INTO item_factura (cantidad, descripcion, precio_unitario, subtotal_sin_iva, alicuota_iva, monto_total_item, factura_id)
VALUES (100, 'Servicio de consultoría', 400.00, 40000.00, 21.0, 48400.00, 3);

-- ---------------------------------------------------------------------------
-- FACTURA 4: Tecnología Avanzada - $8,500
-- ---------------------------------------------------------------------------

INSERT INTO documento_comercial (
    id_documento, tipo_documento, numero_documento, fecha_emision, monto_total,
    moneda, categoria,  version_documento,
    fecha_creacion, fecha_actualizacion
) VALUES (
    4, 'FACTURA', '0001-00000004', '2025-10-08', 8500.00,
    'ARS', 'Tecnología', 'ORIGINAL',
    '2025-10-08', '2025-10-08'
);

INSERT INTO factura (
    id_documento, tipo_factura, vendedor_nombre, vendedor_cuit, vendedor_condicioniva,
    comprador_nombre, comprador_cuit, comprador_condicioniva,
    cae, vencimiento_cae
) VALUES (
    4, 'B', 'Tecnología Avanzada', '27-99887766-5', 'Monotributo',
    'Mi Empresa S.A.', '30-98765432-1', 'Responsable Inscripto',
    '75423456789015', '2025-10-18'
);

INSERT INTO item_factura (cantidad, descripcion, precio_unitario, subtotal_sin_iva, alicuota_iva, monto_total_item, factura_id)
VALUES (2, 'Notebook Dell Latitude', 4250.00, 8500.00, 0.0, 8500.00, 4);

-- ---------------------------------------------------------------------------
-- FACTURA 5: Servicios XYZ - $3,500
-- ---------------------------------------------------------------------------

INSERT INTO documento_comercial (
    id_documento, tipo_documento, numero_documento, fecha_emision, monto_total,
    moneda, categoria, version_documento,
    fecha_creacion, fecha_actualizacion
) VALUES (
    5, 'FACTURA', '0001-00000005', '2025-09-25', 3500.00,
    'ARS', 'Servicios', 'ORIGINAL',
    '2025-09-25', '2025-09-25'
);

INSERT INTO factura (
    id_documento, tipo_factura, vendedor_nombre, vendedor_cuit, vendedor_condicioniva,
    comprador_nombre, comprador_cuit, comprador_condicioniva,
    cae, vencimiento_cae
) VALUES (
    5, 'C', 'Servicios XYZ', '20-44556677-8', 'Exento',
    'Mi Empresa S.A.', '30-98765432-1', 'Responsable Inscripto',
    '75523456789016', '2025-10-05'
);

INSERT INTO item_factura (cantidad, descripcion, precio_unitario, subtotal_sin_iva, alicuota_iva, monto_total_item, factura_id)
VALUES (1, 'Mantenimiento mensual', 3500.00, 3500.00, 0.0, 3500.00, 5);

-- ---------------------------------------------------------------------------
-- FACTURA 6: Logística Express - $2,500
-- ---------------------------------------------------------------------------

INSERT INTO documento_comercial (
    id_documento, tipo_documento, numero_documento, fecha_emision, monto_total,
    moneda, categoria, version_documento,
    fecha_creacion, fecha_actualizacion
) VALUES (
    6, 'FACTURA', '0001-00000006', '2025-10-18', 2500.00,
    'ARS', 'Transporte', 'ORIGINAL',
    '2025-10-18', '2025-10-18'
);

INSERT INTO factura (
    id_documento, tipo_factura, vendedor_nombre, vendedor_cuit, vendedor_condicioniva,
    comprador_nombre, comprador_cuit, comprador_condicioniva,
    cae, vencimiento_cae
) VALUES (
    6, 'B', 'Logística Express', '30-11223344-5', 'Responsable Inscripto',
    'Mi Empresa S.A.', '30-98765432-1', 'Responsable Inscripto',
    '75623456789017', '2025-10-28'
);

INSERT INTO item_factura (cantidad, descripcion, precio_unitario, subtotal_sin_iva, alicuota_iva, monto_total_item, factura_id)
VALUES (1, 'Flete CABA a Rosario', 2500.00, 2500.00, 0.0, 2500.00, 6);

-- ---------------------------------------------------------------------------
-- FACTURA 7: Supermercado Central - $15,000
-- ---------------------------------------------------------------------------

INSERT INTO documento_comercial (
    id_documento, tipo_documento, numero_documento, fecha_emision, monto_total,
    moneda, categoria, version_documento,
    fecha_creacion, fecha_actualizacion
) VALUES (
    7, 'FACTURA', '0001-00000007', '2025-10-14', 15000.00,
    'ARS', 'Alimentación', 'ORIGINAL',
    '2025-10-14', '2025-10-14'
);

INSERT INTO factura (
    id_documento, tipo_factura, vendedor_nombre, vendedor_cuit, vendedor_condicioniva,
    comprador_nombre, comprador_cuit, comprador_condicioniva,
    cae, vencimiento_cae
) VALUES (
    7, 'B', 'Supermercado Central', '30-22334455-6', 'Responsable Inscripto',
    'Mi Empresa S.A.', '30-98765432-1', 'Responsable Inscripto',
    '75723456789018', '2025-10-24'
);

INSERT INTO item_factura (cantidad, descripcion, precio_unitario, subtotal_sin_iva, alicuota_iva, monto_total_item, factura_id)
VALUES (1, 'Compra mensual oficina', 15000.00, 15000.00, 0.0, 15000.00, 7);

-- ---------------------------------------------------------------------------
-- FACTURA 8: Farmacia del Centro - $6,800
-- ---------------------------------------------------------------------------

INSERT INTO documento_comercial (
    id_documento, tipo_documento, numero_documento, fecha_emision, monto_total,
    moneda, categoria, version_documento,
    fecha_creacion, fecha_actualizacion
) VALUES (
    8, 'FACTURA', '0001-00000008', '2025-10-22', 6800.00,
    'ARS', 'Salud', 'ORIGINAL',
    '2025-10-22', '2025-10-22'
);

INSERT INTO factura (
    id_documento, tipo_factura, vendedor_nombre, vendedor_cuit, vendedor_condicioniva,
    comprador_nombre, comprador_cuit, comprador_condicioniva,
    cae, vencimiento_cae
) VALUES (
    8, 'B', 'Farmacia del Centro', '27-33445566-7', 'Monotributo',
    'Mi Empresa S.A.', '30-98765432-1', 'Responsable Inscripto',
    '75823456789019', '2025-11-01'
);

INSERT INTO item_factura (cantidad, descripcion, precio_unitario, subtotal_sin_iva, alicuota_iva, monto_total_item, factura_id)
VALUES (1, 'Medicamentos y suministros', 6800.00, 6800.00, 0.0, 6800.00, 8);

-- ---------------------------------------------------------------------------
-- FACTURA 9: Instituto de Capacitación - $12,000
-- ---------------------------------------------------------------------------

INSERT INTO documento_comercial (
    id_documento, tipo_documento, numero_documento, fecha_emision, monto_total,
    moneda, categoria, version_documento,
    fecha_creacion, fecha_actualizacion
) VALUES (
    9, 'FACTURA', '0001-00000009', '2025-10-05', 12000.00,
    'ARS', 'Educación', 'ORIGINAL',
    '2025-10-05', '2025-10-05'
);

INSERT INTO factura (
    id_documento, tipo_factura, vendedor_nombre, vendedor_cuit, vendedor_condicioniva,
    comprador_nombre, comprador_cuit, comprador_condicioniva,
    cae, vencimiento_cae
) VALUES (
    9, 'B', 'Instituto de Capacitación', '30-44556677-8', 'Responsable Inscripto',
    'Mi Empresa S.A.', '30-98765432-1', 'Responsable Inscripto',
    '75923456789020', '2025-10-15'
);

INSERT INTO item_factura (cantidad, descripcion, precio_unitario, subtotal_sin_iva, alicuota_iva, monto_total_item, factura_id)
VALUES (1, 'Curso de capacitación empresarial', 12000.00, 12000.00, 0.0, 12000.00, 9);

-- ---------------------------------------------------------------------------
-- FACTURA 10: Empresa de Electricidad - $4,200
-- ---------------------------------------------------------------------------

INSERT INTO documento_comercial (
    id_documento, tipo_documento, numero_documento, fecha_emision, monto_total,
    moneda, categoria, version_documento,
    fecha_creacion, fecha_actualizacion
) VALUES (
    10, 'FACTURA', '0001-00000010', '2025-10-01', 4200.00,
    'ARS', 'Servicios Públicos', 'ORIGINAL',
    '2025-10-01', '2025-10-01'
);

INSERT INTO factura (
    id_documento, tipo_factura, vendedor_nombre, vendedor_cuit, vendedor_condicioniva,
    comprador_nombre, comprador_cuit, comprador_condicioniva,
    cae, vencimiento_cae
) VALUES (
    10, 'B', 'Empresa de Electricidad', '30-55667788-9', 'Responsable Inscripto',
    'Mi Empresa S.A.', '30-98765432-1', 'Responsable Inscripto',
    '76023456789021', '2025-10-11'
);

INSERT INTO item_factura (cantidad, descripcion, precio_unitario, subtotal_sin_iva, alicuota_iva, monto_total_item, factura_id)
VALUES (1, 'Consumo eléctrico mensual', 4200.00, 4200.00, 0.0, 4200.00, 10);


-- ============================================================================
-- 4. MOVIMIENTOS/REGISTROS (20 registros)
-- ============================================================================
-- Estos movimientos tienen diferentes niveles de coincidencia con los documentos

-- Movimiento 1: ALTA coincidencia con Factura 1 (95%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 12500.00, '2025-10-15', 'Compras', NULL, 'Proveedor ABC', 
    'Pago a Proveedor ABC por suministros',
    '2025-10-15', '2025-10-15', 'TRANSFERENCIA', 'ARS'
);

-- Movimiento 2: MEDIA coincidencia con Factura 2 (65%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 5200.00, '2025-10-10', 'Servicios', NULL, 'Materiales del Sur',
    'Compra de materiales de construcción',
    '2025-10-10', '2025-10-10', 'TRANSFERENCIA', 'ARS'
);

-- Movimiento 3: ALTA coincidencia con Factura 3 (90%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Ingreso', 45000.00, '2025-10-20', 'Ventas', 'Cliente XYZ', NULL,
    'Cobro de factura a Cliente XYZ S.R.L.',
    '2025-10-20', '2025-10-20', 'TRANSFERENCIA', 'ARS'
);

-- Movimiento 4: MEDIA coincidencia con Factura 4 (60%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 8800.00, '2025-10-09', 'Tecnología', NULL, 'Tecnología Avanzada',
    'Compra de equipamiento informático',
    '2025-10-09', '2025-10-09', 'TRANSFERENCIA', 'ARS'
);

-- Movimiento 5: BAJA coincidencia con Factura 5 (35%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 3200.00, '2025-10-05', 'Servicios', NULL, 'Servicios XYZ',
    'Pago de servicios varios',
    '2025-10-05', '2025-10-05', 'EFECTIVO', 'ARS'
);

-- Movimiento 6: ALTA coincidencia con Factura 6 (92%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 2500.00, '2025-10-18', 'Transporte', NULL, 'Logística Express',
    'Pago de flete para envío de mercadería',
    '2025-10-18', '2025-10-18', 'TRANSFERENCIA', 'ARS'
);

-- Movimiento 7: MEDIA coincidencia con Factura 7 (68%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 15500.00, '2025-10-13', 'Alimentación', NULL, 'Supermercado',
    'Compra de alimentos para oficina',
    '2025-10-13', '2025-10-13', 'TARJETA', 'ARS'
);

-- Movimiento 8: ALTA coincidencia con Factura 8 (94%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 6800.00, '2025-10-22', 'Salud', NULL, 'Farmacia del Centro',
    'Compra de medicamentos y suministros médicos',
    '2025-10-22', '2025-10-22', 'TRANSFERENCIA', 'ARS'
);

-- Movimiento 9: MEDIA coincidencia con Factura 9 (62%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 11500.00, '2025-10-07', 'Educación', NULL, 'Instituto de Capacitación',
    'Pago de curso de capacitación para empleados',
    '2025-10-07', '2025-10-07', 'TRANSFERENCIA', 'ARS'
);

-- Movimiento 10: ALTA coincidencia con Pagaré 1 (88%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 25000.00, '2025-10-10', 'Financiamiento', NULL, 'Banco Comercial',
    'Pago de cuota de préstamo bancario',
    '2025-10-10', '2025-10-10', 'TRANSFERENCIA', 'ARS'
);

-- Movimiento 11: MEDIA coincidencia con Pagaré 2 (65%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 17500.00, '2025-10-19', 'Compras', NULL, 'Proveedor Industrial',
    'Pago anticipado de mercadería',
    '2025-10-19', '2025-10-19', 'TRANSFERENCIA', 'ARS'
);

-- Movimiento 12: ALTA coincidencia con Recibo 1 (91%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 7200.00, '2025-10-16', 'Alquileres', NULL, 'Inmobiliaria Central',
    'Pago de alquiler mensual de oficina',
    '2025-10-16', '2025-10-16', 'TRANSFERENCIA', 'ARS'
);

-- Movimiento 13: MEDIA coincidencia con Recibo 2 (64%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 4000.00, '2025-10-18', 'Servicios Profesionales', NULL, 'Consultor',
    'Pago de honorarios profesionales',
    '2025-10-18', '2025-10-18', 'EFECTIVO', 'ARS'
);

-- Movimiento 14: ALTA coincidencia con Recibo 3 (93%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 11500.00, '2025-10-23', 'Honorarios', NULL, 'Estudio Jurídico',
    'Pago de asesoramiento legal',
    '2025-10-23', '2025-10-23', 'TRANSFERENCIA', 'ARS'
);

-- Movimiento 15: SIN coincidencias claras
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 1800.00, '2025-10-24', 'Transporte', NULL, 'Uber',
    'Viajes en taxi y transporte',
    '2025-10-24', '2025-10-24', 'MERCADOPAGO', 'ARS'
);

-- Movimiento 16: Ingreso sin coincidencias claras
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Ingreso', 8900.00, '2025-10-26', 'Ventas', 'Cliente Varios', NULL,
    'Cobro de ventas minoristas',
    '2025-10-26', '2025-10-26', 'EFECTIVO', 'ARS'
);

-- Movimiento 17: BAJA coincidencia con Factura 10 (38%)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 4500.00, '2025-10-03', 'Servicios Públicos', NULL, 'Empresa Eléctrica',
    'Pago de factura de luz',
    '2025-10-03', '2025-10-03', 'DEBITO_AUTOMATICO', 'ARS'
);

-- Movimiento 18: Movimiento de Excel (marcado en descripción)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 3200.00, '2025-10-27', 'Oficina', NULL, 'Papelería Central',
    'Compra de útiles de oficina (importado de Excel)',
    '2025-10-27', '2025-10-27', 'TRANSFERENCIA', 'ARS'
);

-- Movimiento 19: Movimiento de MercadoPago (marcado en origen)
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Egreso', 950.00, '2025-10-28', 'Transporte', 'MercadoPago', 'SUBE',
    'Recarga de tarjeta SUBE',
    '2025-10-28', '2025-10-28', 'MERCADOPAGO', 'ARS'
);

-- Movimiento 20: Ingreso grande
INSERT INTO registro (
    tipo, monto_total, fecha_emision, categoria, origen, destino, descripcion,
    fecha_creacion, fecha_actualizacion, medio_pago, moneda
) VALUES (
    'Ingreso', 125000.00, '2025-10-29', 'Ventas', 'Cliente Premium S.A.', NULL,
    'Cobro de proyecto especial',
    '2025-10-29', '2025-10-29', 'TRANSFERENCIA', 'ARS'
);