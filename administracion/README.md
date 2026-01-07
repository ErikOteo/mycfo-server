# Módulo de Administración - MyCFO

Este módulo gestiona usuarios y empresas con sincronización automática a AWS Cognito.

## 🔐 Configuración de Cognito

### Variables de entorno requeridas:

```env
# AWS Cognito (Backend)
COGNITO_USER_POOL_ID=sa-east-1_lTMNrWW7R
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=tu-access-key-id
AWS_SECRET_ACCESS_KEY=tu-secret-access-key

# Frontend
REACT_APP_COGNITO_USER_POOL_ID=sa-east-1_lTMNrWW7R
REACT_APP_COGNITO_CLIENT_ID=3ksssqtg3r49rf6js1t1177hrd
REACT_APP_AWS_REGION=sa-east-1
```

## 📦 Dependencias

El módulo incluye:
- Spring Boot Web & JPA
- PostgreSQL
- AWS SDK for Cognito (v2.20.26)
- Lombok

## 🚀 Endpoints

### Usuarios (`/api/usuarios`)

- `GET /perfil` - Obtener perfil del usuario actual
- `GET /{sub}` - Obtener usuario por sub
- `GET /empresa/{empresaId}` - Listar empleados de empresa
- `POST /` - Crear/actualizar usuario
- `PUT /perfil` - Actualizar perfil propio (sincroniza con Cognito)
- `PUT /{sub}` - Actualizar empleado (sincroniza con Cognito)
- `DELETE /{sub}` - Eliminar empleado (BD + Cognito)
- `PUT /{sub}/activar` - Activar empleado
- `PUT /{sub}/desactivar` - Desactivar empleado

### Empresas (`/api/empresas`)

- `GET /` - Listar todas
- `GET /{id}` - Obtener por ID
- `POST /` - Crear empresa
- `PUT /{id}` - Actualizar empresa

## 🔄 Sincronización BD ↔ Cognito

Todas las operaciones de actualización, eliminación y activación/desactivación de usuarios impactan automáticamente en:
1. Base de datos PostgreSQL
2. AWS Cognito User Pool

## 📊 Modelos

### Usuario
- `sub` (PK) - ID de Cognito
- `nombre`
- `email`
- `telefono`
- `rol` (ADMINISTRADOR/NORMAL)
- `empresaId`
- `activo`

### Empresa
- `id` (PK)
- `nombre`
- `descripcion`

