-- Índices para optimizar performance de queries del dashboard
-- Ejecutar este script en la base de datos de producción

-- Índice compuesto para filtros más comunes (organizacion + fecha)
CREATE INDEX IF NOT EXISTS idx_movimiento_org_fecha 
ON movimiento(organizacion_id, fecha_emision DESC);

-- Índice compuesto para filtros por tipo
CREATE INDEX IF NOT EXISTS idx_movimiento_org_tipo_fecha 
ON movimiento(organizacion_id, tipo, fecha_emision DESC);

-- Índice para conciliación (documento_comercial puede ser NULL)
CREATE INDEX IF NOT EXISTS idx_movimiento_org_conciliado 
ON movimiento(organizacion_id, fecha_emision DESC) 
WHERE documento_comercial IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movimiento_org_pendiente 
ON movimiento(organizacion_id, fecha_emision DESC) 
WHERE documento_comercial IS NULL;

-- Índice para búsquedas por categoría (usado en GROUP BY)
CREATE INDEX IF NOT EXISTS idx_movimiento_org_tipo_categoria 
ON movimiento(organizacion_id, tipo, categoria);

-- Índice para búsquedas por nombre (LIKE queries)
CREATE INDEX IF NOT EXISTS idx_movimiento_origen_nombre 
ON movimiento(LOWER(origen_nombre));

CREATE INDEX IF NOT EXISTS idx_movimiento_destino_nombre 
ON movimiento(LOWER(destino_nombre));

-- Índice para usuario (si se filtra por usuario específico)
CREATE INDEX IF NOT EXISTS idx_movimiento_usuario_fecha 
ON movimiento(usuario_id, fecha_emision DESC);

-- Comentarios sobre el impacto esperado:
-- - idx_movimiento_org_fecha: Acelera todas las queries que filtran por empresa y fecha
-- - idx_movimiento_org_tipo_fecha: Optimiza queries de ingresos/egresos mensuales
-- - idx_movimiento_org_conciliado/pendiente: Mejora queries de conciliación
-- - idx_movimiento_org_tipo_categoria: Acelera GROUP BY categoria (dashboard charts)
-- - idx_movimiento_origen/destino_nombre: Mejora búsquedas por nombre
-- - idx_movimiento_usuario_fecha: Optimiza filtros por usuario específico
