-- ========================================
-- CONFIGURACION
-- ========================================
SET @ORGANIZACION_ID := 1;
SET @USUARIO_ID   := '335c7a9a-d021-704f-ba63-9c18f37959f8';

-- ========================================
-- DATOS INTERCALADOS (documento + factura + registro)
-- Los IDs se generan automaticamente por la base de datos
-- Cada registro se vincula inmediatamente con su documento usando LAST_INSERT_ID()
-- ========================================


-- ENERO 2026

-- Documento + Registro vinculado (Ingreso ARS)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '9051234870',
    '2026-01-08', 1520000, 'ARS', 'Prestacion de Servicios',
    'Original', '2026-01-08', '2026-01-08',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Vendedor',
    'Cliente Andino SA', '30-88234567-9', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Ingreso', 1520000, '2026-01-08 11:24:10', 'Prestacion de Servicios',
    'Cliente Andino SA', '30-88234567-9', 'MyCFO SRL', '30-99999999-7',
    'Servicios de optimizacion financiera enero 2026', '2026-01-08', '2026-01-08',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'ARS',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', @DOCUMENTO_ID
);

-- Documento + Registro vinculado (Ingreso USD)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '6873012459',
    '2026-01-15', 18400, 'USD', 'Consultoria Internacional',
    'Original', '2026-01-15', '2026-01-15',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Vendedor',
    'TechLabs Inc.', '80-76543210-5', 'No Responsable', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Ingreso', 18400, '2026-01-15 09:05:41', 'Consultoria Internacional',
    'TechLabs Inc.', '80-76543210-5', 'MyCFO SRL', '30-99999999-7',
    'Retainer consultoria enero 2026', '2026-01-15', '2026-01-15',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'USD',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', @DOCUMENTO_ID
);

-- Documento + Registro vinculado (Egreso ARS)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '1938475601',
    '2026-01-10', 624000, 'ARS', 'Marketing y Publicidad',
    'Original', '2026-01-10', '2026-01-10',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'Agencia Creativa SRL', '30-55667788-2', 'Responsable Inscripto', 'Direccion Vendedor',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);


-- FEBRERO 2026 (adicionales)

-- Documento + Registro vinculado (Ingreso ARS)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '9045123678',
    '2026-02-23', 1185000, 'ARS', 'Ventas de Productos',
    'Original', '2026-02-23', '2026-02-23',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Vendedor',
    'Retail Andino SAS', '30-55664411-2', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Ingreso', 1185000, '2026-02-04 12:11:33', 'Ventas de Productos',
    'Retail Andino SAS', '30-55664411-2', 'MyCFO SRL', '30-99999999-7',
    'Venta terminales POS febrero 2026', '2026-02-23', '2026-02-23',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'ARS',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', @DOCUMENTO_ID
);

-- Documento + Registro vinculado (Ingreso USD)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '7312459087',
    '2026-02-26', 21250, 'USD', 'Servicios Financieros',
    'Original', '2026-02-26', '2026-02-26',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Vendedor',
    'NorthBridge Capital LLC', '98-77889900-5', 'No Responsable', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Ingreso', 21250, '2026-02-12 09:48:02', 'Servicios Financieros',
    'NorthBridge Capital LLC', '98-77889900-5', 'MyCFO SRL', '30-99999999-7',
    'Advisory fees Q1 2026', '2026-02-26', '2026-02-26',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'USD',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', NULL
);

-- Documento + Registro vinculado (Egreso ARS)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '5689023417',
    '2026-02-15', 395000, 'ARS', 'Capacitacion',
    'Original', '2026-02-15', '2026-02-15',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'Academia Tech SRL', '30-44112233-8', 'Responsable Inscripto', 'Direccion Vendedor',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Egreso', -395000, '2026-02-08 16:05:44', 'Capacitacion',
    'MyCFO SRL', '30-99999999-7', 'Academia Tech SRL', '30-44112233-8',
    'Workshop IA aplicada a finanzas febrero 2026', '2026-02-15', '2026-02-15',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'ARS',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', @DOCUMENTO_ID
);

-- Documento + Registro vinculado (Egreso USD)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '4590768213',
    '2026-02-28', 9100, 'USD', 'Viajes y Viaticos',
    'Original', '2026-02-28', '2026-02-28',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'TravelCorp Ltd.', '98-33442211-7', 'No Responsable', 'Direccion Vendedor',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Egreso', -9100, '2026-02-18 07:42:19', 'Viajes y Viaticos',
    'MyCFO SRL', '30-99999999-7', 'TravelCorp Ltd.', '98-33442211-7',
    'Pasajes y viaticos roadshow inversionistas febrero 2026', '2026-02-28', '2026-02-28',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'USD',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', @DOCUMENTO_ID
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Egreso', -624000, '2026-01-10 14:18:32', 'Marketing y Publicidad',
    'MyCFO SRL', '30-99999999-7', 'Agencia Creativa SRL', '30-55667788-2',
    'Campana digital enero 2026', '2026-01-10', '2026-01-10',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'ARS',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', @DOCUMENTO_ID
);

-- Documento + Registro vinculado (Egreso USD)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '2648395011',
    '2026-01-18', 5200, 'USD', 'Licencias de Software',
    'Original', '2026-01-18', '2026-01-18',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'CloudTools LLC', '98-33445566-1', 'No Responsable', 'Direccion Vendedor',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Egreso', -5200, '2026-01-18 08:55:11', 'Licencias de Software',
    'MyCFO SRL', '30-99999999-7', 'CloudTools LLC', '98-33445566-1',
    'Renovacion licencias nube enero 2026', '2026-01-18', '2026-01-18',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'USD',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', @DOCUMENTO_ID
);


-- FEBRERO 2026

-- Documento + Registro vinculado (Ingreso ARS)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '8174509321',
    '2026-02-05', 1615000, 'ARS', 'Prestacion de Servicios',
    'Original', '2026-02-05', '2026-02-05',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Vendedor',
    'Cliente Patagonico SA', '30-70112233-4', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Ingreso', 1615000, '2026-02-05 10:09:02', 'Prestacion de Servicios',
    'Cliente Patagonico SA', '30-70112233-4', 'MyCFO SRL', '30-99999999-7',
    'Servicios de gestion financiera febrero 2026', '2026-02-05', '2026-02-05',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'ARS',
    '2026-02-05', NULL, 2,
    0, 807500, 0.0, 'Mensual',
    'PAGADO', @DOCUMENTO_ID
);

-- Documento + Registro vinculado (Ingreso USD)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '7012439865',
    '2026-02-20', 17600, 'USD', 'Consultoria Internacional',
    'Original', '2026-02-20', '2026-02-20',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Vendedor',
    'Global Ventures Ltd.', '98-55667788-4', 'No Responsable', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Ingreso', 17600, '2026-02-20 15:22:16', 'Consultoria Internacional',
    'Global Ventures Ltd.', '98-55667788-4', 'MyCFO SRL', '30-99999999-7',
    'Consultoria regional febrero 2026', '2026-02-20', '2026-02-20',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'USD',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', NULL
);

-- Documento + Registro vinculado (Egreso ARS)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '3398157402',
    '2026-02-07', 438000, 'ARS', 'Alquiler Oficina',
    'Original', '2026-02-07', '2026-02-07',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'Inmobiliaria Centro Norte', '30-22334455-9', 'Responsable Inscripto', 'Direccion Vendedor',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Egreso', -438000, '2026-02-07 09:33:09', 'Alquiler Oficina',
    'MyCFO SRL', '30-99999999-7', 'Inmobiliaria Centro Norte', '30-22334455-9',
    'Alquiler oficina central febrero 2026', '2026-02-07', '2026-02-07',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'ARS',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', @DOCUMENTO_ID
);

-- Documento + Registro vinculado (Egreso USD)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '2798413576',
    '2026-02-12', 6800, 'USD', 'Publicidad Internacional',
    'Original', '2026-02-12', '2026-02-12',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'MediaOcean LLC', '98-44556677-2', 'No Responsable', 'Direccion Vendedor',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Egreso', -6800, '2026-02-12 17:47:25', 'Publicidad Internacional',
    'MyCFO SRL', '30-99999999-7', 'MediaOcean LLC', '98-44556677-2',
    'Publicidad performance mercados USA febrero 2026', '2026-02-12', '2026-02-12',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'USD',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', NULL
);


-- FEBRERO 2026 (nuevos movimientos solicitados)

-- Documento + Registro vinculado (Ingreso ARS)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '8451902764',
    '2026-02-21', 5180000, 'ARS', 'Implementacion ERP Regional',
    'Original', '2026-02-21', '2026-02-21',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Vendedor',
    'Grupo Nexo Empresarial SA', '30-77889944-1', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Ingreso', 5180000, '2026-02-21 11:36:18', 'Implementacion ERP Regional',
    'Grupo Nexo Empresarial SA', '30-77889944-1', 'MyCFO SRL', '30-99999999-7',
    'Implementacion y parametrizacion ERP febrero 2026', '2026-02-21', '2026-02-21',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'ARS',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', @DOCUMENTO_ID
);

-- Documento + Registro vinculado (Ingreso USD)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '7364029158',
    '2026-02-25', 4850, 'USD', 'Planeamiento Fiscal Offshore',
    'Original', '2026-02-25', '2026-02-25',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Vendedor',
    'BluePeak Holdings LLC', '98-77441122-9', 'No Responsable', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Ingreso', 4850, '2026-02-25 14:20:51', 'Planeamiento Fiscal Offshore',
    'BluePeak Holdings LLC', '98-77441122-9', 'MyCFO SRL', '30-99999999-7',
    'Servicio de planeamiento fiscal internacional febrero 2026', '2026-02-25', '2026-02-25',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'USD',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', @DOCUMENTO_ID
);

-- Documento + Registro vinculado (Egreso ARS)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '5629074183',
    '2026-02-22', 2072000, 'ARS', 'Infraestructura Tecnologica',
    'Original', '2026-02-22', '2026-02-22',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'InfraOps Argentina SA', '30-66554433-2', 'Responsable Inscripto', 'Direccion Vendedor',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Egreso', -2072000, '2026-02-22 10:12:37', 'Infraestructura Tecnologica',
    'MyCFO SRL', '30-99999999-7', 'InfraOps Argentina SA', '30-66554433-2',
    'Adquisicion y montaje de infraestructura tecnologica febrero 2026', '2026-02-22', '2026-02-22',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'ARS',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', @DOCUMENTO_ID
);

-- Documento + Registro vinculado (Egreso USD)
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '4983507261',
    '2026-02-26', 1940, 'USD', 'Servicios Legales Internacionales',
    'Original', '2026-02-26', '2026-02-26',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'Harbor Legal Advisors LLC', '98-33221144-8', 'No Responsable', 'Direccion Vendedor',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);
INSERT INTO registro_db.registro (
    tipo, monto_total, fecha_emision, categoria,
    origen_nombre, origen_cuit, destino_nombre, destino_cuit,
    descripcion, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id, medio_pago, moneda,
    fecha_vencimiento, monto_pagado, cantidad_cuotas,
    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,
    estado, id_documento
) VALUES (
    'Egreso', -1940, '2026-02-26 18:08:44', 'Servicios Legales Internacionales',
    'MyCFO SRL', '30-99999999-7', 'Harbor Legal Advisors LLC', '98-33221144-8',
    'Honorarios legales para contratos internacionales febrero 2026', '2026-02-26', '2026-02-26',
    @USUARIO_ID, @ORGANIZACION_ID, 'Transferencia', 'USD',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'PAGADO', @DOCUMENTO_ID
);

-- ========================================
-- FACTURAS SIN VINCULAR (Febrero 2026)
-- Para conciliar manualmente
-- Ejemplo en USD siguiendo el formato del archivo 7-registros-facturas-2023-2024-2025.sql
-- ========================================

-- Factura sin vincular
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '5123498701',
    '2026-02-18', 12400, 'USD', 'Servicios en el Exterior',
    'Original', '2026-02-18', '2026-02-18',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Vendedor',
    'Pacific Tech Corp.', '98-22334455-6', 'No Responsable', 'Direccion Comprador',
    'PAGADO'
);

-- Factura sin vincular
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '6345891027',
    '2026-02-24', 9400, 'USD', 'Compras de Negocio',
    'Original', '2026-02-24', '2026-02-24',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'Proveedor Internacional LLC', '98-66778899-3', 'No Responsable', 'Direccion Vendedor',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);

-- Factura sin vincular
INSERT INTO documento_comercial (
    tipo_documento, numero_documento,
    fecha_emision, monto_total, moneda, categoria,
    version_documento, fecha_creacion, fecha_actualizacion,
    usuario_id, organizacion_id
) VALUES (
    'FACTURA', '7821453690',
    '2026-02-27', 15800, 'USD', 'Licencias de Software',
    'Original', '2026-02-27', '2026-02-27',
    @USUARIO_ID, @ORGANIZACION_ID
);
SET @DOCUMENTO_ID = LAST_INSERT_ID();
INSERT INTO factura (
    id_documento, tipo_factura,
    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,
    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,
    estado_pago
) VALUES (
    @DOCUMENTO_ID, 'A',
    'SaaS Global Ltd.', '98-11998877-0', 'No Responsable', 'Direccion Vendedor',
    'MyCFO SRL', '30-99999999-7', 'Responsable Inscripto', 'Direccion Comprador',
    'PAGADO'
);
