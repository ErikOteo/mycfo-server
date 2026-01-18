CREATE DATABASE IF NOT EXISTS administracion_db;
CREATE DATABASE IF NOT EXISTS notificacion_db;
CREATE DATABASE IF NOT EXISTS pronostico_db;
CREATE DATABASE IF NOT EXISTS registro_db;
CREATE DATABASE IF NOT EXISTS ia_db;
CREATE DATABASE IF NOT EXISTS reporte_db;

CREATE USER 'administrador'@'%' IDENTIFIED BY 'fedorenko1234';
-- Usuario usado por las aplicaciones en local (coincide con .env)
CREATE USER IF NOT EXISTS 'user'@'%' IDENTIFIED BY 'password';

GRANT ALL PRIVILEGES ON administracion_db.* TO 'administrador'@'%';
GRANT ALL PRIVILEGES ON notificacion_db.* TO 'administrador'@'%';
GRANT ALL PRIVILEGES ON pronostico_db.* TO 'administrador'@'%';
GRANT ALL PRIVILEGES ON registro_db.* TO 'administrador'@'%';
GRANT ALL PRIVILEGES ON ia_db.* TO 'administrador'@'%';
GRANT ALL PRIVILEGES ON reporte_db.* TO 'administrador'@'%';
GRANT ALL PRIVILEGES ON administracion_db.* TO 'user'@'%';
GRANT ALL PRIVILEGES ON notificacion_db.* TO 'user'@'%';
GRANT ALL PRIVILEGES ON pronostico_db.* TO 'user'@'%';
GRANT ALL PRIVILEGES ON registro_db.* TO 'user'@'%';
GRANT ALL PRIVILEGES ON ia_db.* TO 'user'@'%';
GRANT ALL PRIVILEGES ON reporte_db.* TO 'user'@'%';
