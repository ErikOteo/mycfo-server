-- Columna
SET @add_column_sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE presupuesto ADD COLUMN organizacion_id BIGINT NULL',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'presupuesto'
      AND column_name = 'organizacion_id'
);

PREPARE stmt FROM @add_column_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop índice viejo
SET @drop_idx_sql := (
    SELECT IF(
        COUNT(*) > 0,
        'ALTER TABLE presupuesto DROP INDEX uk_presupuesto_owner_nombre_periodo',
        'SELECT 1'
    )
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'presupuesto'
      AND index_name = 'uk_presupuesto_owner_nombre_periodo'
);

PREPARE stmt FROM @drop_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear índice nuevo usando las columnas reales
SET @create_idx_sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE presupuesto ADD UNIQUE INDEX uk_presupuesto_owner_org_nombre_periodo (owner_sub, organizacion_id, nombre, desde, hasta)',
        'SELECT 1'
    )
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'presupuesto'
      AND index_name = 'uk_presupuesto_owner_org_nombre_periodo'
);

PREPARE stmt FROM @create_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- TODO: realizar backfill de presupuesto.organizacion_id cuando existan filas NULL detectadas durante el arranque.
