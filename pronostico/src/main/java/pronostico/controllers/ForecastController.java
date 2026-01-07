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
import pronostico.services.ForecastService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/forecasts")
@RequiredArgsConstructor
@Slf4j
public class ForecastController {

    private final ForecastService forecastService;
    private final pronostico.services.AdministracionService administracionService;

    private String requireSub(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalido");
        }
        return jwt.getSubject();
    }

    /**
     * Listar todos los forecasts de la empresa del usuario
     */
    @GetMapping
    public ResponseEntity<List<ForecastListDTO>> listarForecasts(@AuthenticationPrincipal Jwt jwt) {
        try {
            String usuarioSub = requireSub(jwt);
            Long organizacionId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            
            List<ForecastListDTO> forecasts = forecastService.listarForecasts(organizacionId);
            return ResponseEntity.ok(forecasts);
        } catch (RuntimeException e) {
            log.error("Error al listar forecasts: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtener un forecast específico con todas sus líneas
     */
    @GetMapping("/{id}")
    public ResponseEntity<ForecastDTO> obtenerForecast(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        try {
            ForecastDTO forecast = forecastService.obtenerForecast(id);
            return ResponseEntity.ok(forecast);
        } catch (ResponseStatusException e) {
            if (e.getStatusCode().value() == HttpStatus.NOT_FOUND.value()) {
                return ResponseEntity.notFound().build();
            }
            throw e;
        }
    }

    /**
     * Generar un nuevo forecast manualmente
     */
    @PostMapping("/generar/{forecastConfigId}")
    public ResponseEntity<ForecastDTO> generarForecast(
            @PathVariable Long forecastConfigId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String usuarioSub = requireSub(jwt);
            ForecastDTO forecast = forecastService.generarForecast(forecastConfigId, usuarioSub);
            return ResponseEntity.status(HttpStatus.CREATED).body(forecast);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error al generar forecast: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Eliminar un forecast (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarForecast(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        try {
            String usuarioSub = requireSub(jwt);
            forecastService.eliminarForecast(id, usuarioSub);
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
            log.error("Error al eliminar forecast: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Generar un rolling forecast en tiempo real sin guardarlo
     * @param horizonteMeses Meses a pronosticar hacia adelante
     */
    @PostMapping("/rolling")
    public ResponseEntity<Map<String, Object>> generarRollingForecast(
            @RequestParam Integer horizonteMeses,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String usuarioSub = requireSub(jwt);
            Map<String, Object> response = forecastService.generarRollingForecast(usuarioSub, horizonteMeses);
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error al generar rolling forecast: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}

