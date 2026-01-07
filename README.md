# mycfo
MyCFO App
## Pronostico

- Backend requiere configurar spring.security.oauth2.resourceserver.jwt.issuer-uri con el issuer de Cognito.
- Frontend debe exponer REACT_APP_URL_PRONOSTICO apuntando al servicio.
- En local: iniciar backend (Flyway aplica V2__add_owner_sub_to_presupuesto.sql) y el front en localhost:3000; iniciar sesión para obtener ccessToken en sessionStorage.
- Requests sin token devuelven 401; token de un usuario solo lista/gestiona presupuestos con su owner_sub y recibe 403 al acceder a los de otro usuario.

