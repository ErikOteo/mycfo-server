ALTER TABLE presupuesto
    ADD COLUMN created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) AFTER hasta;

CREATE INDEX idx_presupuesto_created_at ON presupuesto (created_at);
