# MyCFO Project Instructions for AI Coding Agents

## Project Overview
MyCFO is a microservices-based financial management application with a React frontend and multiple Spring Boot backend services.

### Architecture
- **Frontend**: React application (`/frontend`)
  - Port: 3000
  - Key dependencies: React, Material-UI
  - Authentication: AWS Cognito

- **Backend Services**:
  1. `administracion` (8081): Administration service
  2. `consolidacion` (8082): Consolidation service
  3. `ia` (8083): AI/ML service
  4. `notificacion` (8084): Notification service
  5. `pronostico` (8085): Forecasting service
  6. `registro` (8086): Registration service
  7. `reporte` (8087): Reporting service

Each service has:
- Independent MySQL database
- Dockerfile for containerization
- Spring Boot configuration in `application.properties`

## Development Setup

### Database
```sql
# Each service has its own database:
- administracion_db
- consolidacion_db
- ia_db
- notificacion_db
- pronostico_db
- registro_db
- reporte_db
```

### Environment Configuration
- Backend services require `spring.security.oauth2.resourceserver.jwt.issuer-uri` configuration for Cognito
- Frontend requires environment variables:
  - `REACT_APP_URL_PRONOSTICO`: Points to pronostico service

### Authentication Flow
1. Frontend uses AWS Cognito for authentication
2. Access token stored in `sessionStorage`
3. Requests without token receive 401
4. Token scoped to user's `owner_sub` - 403 for unauthorized access

## Development Patterns

### Service Communication
- Services communicate via REST APIs
- Base URLs configured in environment variables (see docker-compose.yml)
- Cross-service calls should include authorization headers

### Security Patterns
- JWT validation in all services
- Owner-based resource access control
- Database-level user isolation via `owner_sub`

### Common Files to Reference
- Service configuration: `docker-compose.yml`
- Database initialization: `init.sql`
- Authentication example: `pronostico` service implementation

## Development Workflow
1. Start MySQL with initialized databases
2. Start required backend services
3. Start frontend with `npm start`
4. Login to get valid access token
5. Make authenticated API calls

## Common Issues & Solutions
- 401 errors: Check access token presence and validity
- 403 errors: Verify resource ownership matches token `owner_sub`
- Database connection issues: Ensure service-specific DB exists and credentials match

Remember to maintain service isolation and proper authentication flows when making changes.