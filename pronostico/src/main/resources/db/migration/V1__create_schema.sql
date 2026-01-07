-- V1__create_schema.sql

CREATE TABLE IF NOT EXISTS presupuesto (
  id BIGINT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  desde VARCHAR(10) NOT NULL,
  hasta VARCHAR(10) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE INDEX idx_presupuesto_desde ON presupuesto (desde);
CREATE INDEX idx_presupuesto_hasta ON presupuesto (hasta);

-- Orden específico:
-- id, presupuesto_id, mes, categoria, tipo, monto_estimado, monto_real, source_type, source_id, created_at, updated_at
CREATE TABLE IF NOT EXISTS presupuesto_linea (
  id BIGINT NOT NULL AUTO_INCREMENT,
  presupuesto_id BIGINT NOT NULL,
  mes VARCHAR(10) NOT NULL,
  categoria VARCHAR(255) NOT NULL,
  tipo VARCHAR(10) NOT NULL,
  monto_estimado DECIMAL(19,2) NOT NULL DEFAULT 0,
  monto_real DECIMAL(19,2) NULL,
  source_type VARCHAR(15) NOT NULL,
  source_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_linea_presupuesto FOREIGN KEY (presupuesto_id) REFERENCES presupuesto(id)
) ENGINE=InnoDB;

CREATE INDEX idx_linea_presupuesto ON presupuesto_linea (presupuesto_id);
CREATE INDEX idx_linea_presupuesto_mes ON presupuesto_linea (presupuesto_id, mes);

-- (Opcional) Otras tablas según tus entidades:
CREATE TABLE IF NOT EXISTS presupuesto_detalle (
  id BIGINT NOT NULL AUTO_INCREMENT,
  presupuesto_id BIGINT NOT NULL,
  mes VARCHAR(7) NOT NULL,
  ingreso_estimado DECIMAL(19,2) NOT NULL DEFAULT 0,
  egreso_estimado  DECIMAL(19,2) NOT NULL DEFAULT 0,
  ingreso_real     DECIMAL(19,2) NOT NULL DEFAULT 0,
  egreso_real      DECIMAL(19,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_detalle_presupuesto FOREIGN KEY (presupuesto_id) REFERENCES presupuesto(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS presupuesto_mes_categoria (
  id BIGINT NOT NULL AUTO_INCREMENT,
  presupuesto_detalle_id BIGINT NOT NULL,
  categoria VARCHAR(255) NOT NULL,
  tipo VARCHAR(10) NOT NULL,
  monto_estimado DECIMAL(19,2) NOT NULL DEFAULT 0,
  monto_real DECIMAL(19,2) NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_cat_detalle FOREIGN KEY (presupuesto_detalle_id) REFERENCES presupuesto_detalle(id)
) ENGINE=InnoDB;
