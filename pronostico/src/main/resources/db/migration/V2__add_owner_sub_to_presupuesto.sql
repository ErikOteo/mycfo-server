ALTER TABLE presupuesto ADD COLUMN owner_sub VARCHAR(64) NOT NULL;
CREATE INDEX idx_presupuesto_owner_sub ON presupuesto(owner_sub);

-- UPDATE presupuesto SET owner_sub = 'ADMIN_TEMP_SUB';
