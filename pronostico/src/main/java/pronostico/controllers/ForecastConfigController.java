package pronostico.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pronostico.dtos.*;
import pronostico.services.ForecastConfigService;

import java.util.List;

@RestController
@RequestMapping("/api/forecast-config")
@RequiredArgsConstructor
@Slf4j
public class ForecastConfigController {

    private final ForecastConfigService forecastConfigService;
    private final pronostico.services.AdministracionService administracionService;

    private String requireSub(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalido");
        }
        return jwt.getSubject();
    }

    /**
     * Obtener todas las configuraciones de la empresa del usuario
     */
    @GetMapping
    public ResponseEntity<List<ForecastConfigDTO>> obtenerConfiguraciones(@AuthenticationPrincipal Jwt jwt) {
        try {
            String usuarioSub = requireSub(jwt);
            Long organizacionId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            
            List<ForecastConfigDTO> configs = forecastConfigService.obtenerConfiguracionesActivas(organizacionId);
            return ResponseEntity.ok(configs);
        } catch (RuntimeException e) {
            log.error("Error al obtener configuraciones: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtener todas las configuraciones (incluyendo inactivas)
     */
    @GetMapping("/todas")
    public ResponseEntity<List<ForecastConfigDTO>> obtenerTodasLasConfiguraciones(@AuthenticationPrincipal Jwt jwt) {
        try {
            String usuarioSub = requireSub(jwt);
            Long organizacionId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            
            List<ForecastConfigDTO> configs = forecastConfigService.obtenerConfiguraciones(organizacionId);
            return ResponseEntity.ok(configs);
        } catch (RuntimeException e) {
            log.error("Error al obtener configuraciones: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtener una configuración por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ForecastConfigDTO> obtenerConfiguracion(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        try {
            ForecastConfigDTO config = forecastConfigService.obtenerPorId(id);
            return ResponseEntity.ok(config);
        } catch (ResponseStatusException e) {
            if (e.getStatusCode().value() == HttpStatus.NOT_FOUND.value()) {
                return ResponseEntity.notFound().build();
            }
            throw e;
        }
    }

    /**
     * Crear una nueva configuración
     */
    @PostMapping
    public ResponseEntity<ForecastConfigDTO> crearConfiguracion(
            @RequestBody CrearForecastConfigRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String usuarioSub = requireSub(jwt);
            ForecastConfigDTO config = forecastConfigService.crearConfiguracion(request, usuarioSub);
            return ResponseEntity.status(HttpStatus.CREATED).body(config);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error al crear configuración: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Actualizar una configuración
     */
    @PutMapping("/{id}")
    public ResponseEntity<ForecastConfigDTO> actualizarConfiguracion(
            @PathVariable Long id,
            @RequestBody ActualizarForecastConfigRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String usuarioSub = requireSub(jwt);
            ForecastConfigDTO config = forecastConfigService.actualizarConfiguracion(id, request, usuarioSub);
            return ResponseEntity.ok(config);
        } catch (ResponseStatusException e) {
            if (e.getStatusCode().value() == HttpStatus.NOT_FOUND.value()) {
                return ResponseEntity.notFound().build();
            }
            if (e.getStatusCode().value() == HttpStatus.FORBIDDEN.value()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            throw e;
        } catch (Exception e) {
            log.error("Error al actualizar configuración: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Eliminar una configuración
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarConfiguracion(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        try {
            String usuarioSub = requireSub(jwt);
            forecastConfigService.eliminarConfiguracion(id, usuarioSub);
            return ResponseEntity.noContent().build();
        } catch (ResponseStatusException e) {
            if (e.getStatusCode().value() == HttpStatus.NOT_FOUND.value()) {
                return ResponseEntity.notFound().build();
            }
            if (e.getStatusCode().value() == HttpStatus.FORBIDDEN.value()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            throw e;
        } catch (Exception e) {
            log.error("Error al eliminar configuración: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}

