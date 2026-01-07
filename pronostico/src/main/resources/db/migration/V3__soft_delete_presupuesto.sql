ALTER TABLE presupuesto ADD COLUMN deleted TINYINT(1) NOT NULL DEFAULT 0 AFTER hasta;
ALTER TABLE presupuesto ADD COLUMN deleted_at DATETIME NULL AFTER deleted;
ALTER TABLE presupuesto ADD COLUMN deleted_by VARCHAR(64) NULL AFTER deleted_at;

CREATE INDEX idx_presupuesto_deleted ON presupuesto (deleted);
