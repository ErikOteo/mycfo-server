-- V2 safe: agrega owner_sub si no existe, backfill, y recién luego NOT NULL

-- 1) crear columna si no existe (nullable)
SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'presupuesto'
    AND COLUMN_NAME = 'owner_sub'
);

SET @sql := IF(@col_exists = 0,
  'ALTER TABLE presupuesto ADD COLUMN owner_sub VARCHAR(64) NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) backfill si quedó NULL
UPDATE presupuesto
SET owner_sub = COALESCE(owner_sub, 'unknown')
WHERE owner_sub IS NULL;

-- 3) asegurar NOT NULL
ALTER TABLE presupuesto MODIFY owner_sub VARCHAR(64) NOT NULL;
