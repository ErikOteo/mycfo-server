-- Script para crear la tabla de invitaciones
-- Ejecutar en la base de datos del módulo de administración

CREATE TABLE IF NOT EXISTS invitaciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    empresa_id BIGINT NOT NULL,
    empresa_nombre VARCHAR(255) NOT NULL,
    sub_usuario_invitador VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    estado ENUM('PENDIENTE', 'USADA', 'EXPIRADA') NOT NULL DEFAULT 'PENDIENTE',
    fecha_uso TIMESTAMP NULL,
    
    INDEX idx_token (token),
    INDEX idx_email (email),
    INDEX idx_empresa_id (empresa_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_expiracion (fecha_expiracion)
);

-- Comentarios sobre la tabla
-- email: Email del colaborador invitado
-- token: Token único para la invitación (UUID sin guiones)
-- empresa_id: ID de la empresa que invita
-- empresa_nombre: Nombre de la empresa (para mostrar en el email)
-- sub_usuario_invitador: Sub del usuario que envía la invitación
-- fecha_creacion: Cuando se creó la invitación
-- fecha_expiracion: Cuando expira (30 minutos después de la creación)
-- estado: Estado actual de la invitación
-- fecha_uso: Cuando se usó la invitación (si se usó)
