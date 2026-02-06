package administracion.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import administracion.services.SolicitudAccesoService;
import administracion.models.SolicitudAcceso;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/solicitudes")
@RequiredArgsConstructor
public class SolicitudAccesoController {

    private final SolicitudAccesoService solicitudService;

    @PostMapping("/")
    public ResponseEntity<?> crearSolicitud(
            @RequestHeader(value = "X-Usuario-Sub") String subUsuario,
            @RequestBody Map<String, Object> body) {
        try {
            String nombre = (String) body.get("nombre");
            String email = (String) body.get("email");
            Long empresaId = Long.valueOf(body.get("empresaId").toString());

            SolicitudAcceso solicitud = solicitudService.crearSolicitud(subUsuario, nombre, email, empresaId);
            return ResponseEntity.ok(solicitud);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/pendientes")
    public ResponseEntity<List<SolicitudAcceso>> listarPendientes(@RequestParam Long empresaId) {
        // En una implementación real, verificar que el usuario solicitante sea admin de
        // la empresaId
        return ResponseEntity.ok(solicitudService.listarPendientesPorEmpresa(empresaId));
    }

    @PostMapping("/{id}/resolver")
    public ResponseEntity<?> resolverSolicitud(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            boolean aprobar = (boolean) body.get("aprobar");
            // rol opcional, por defecto COLABORADOR
            String rol = body.containsKey("rol") ? (String) body.get("rol") : "COLABORADOR";

            SolicitudAcceso solicitud = solicitudService.resolverSolicitud(id, aprobar, rol);

            if (aprobar) {
                // Aqui deberíamos llamar a la lógica de vinculación real
                // Por ahora asumimos que la solicitud se marca APROBADA
                // Y en una iteración futura aseguramos la integridad transaccional
                // TODO: Llamar a usuarioService.vincular(solicitud.getUsuarioSub(),
                // solicitud.getEmpresa().getId(), rol);
            }

            return ResponseEntity.ok(solicitud);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/mi-ultima")
    public ResponseEntity<SolicitudAcceso> obtenerMiUltimaSolicitud(
            @RequestHeader(value = "X-Usuario-Sub") String subUsuario) {
        SolicitudAcceso solicitud = solicitudService.obtenerUltimaSolicitud(subUsuario);
        if (solicitud != null) {
            return ResponseEntity.ok(solicitud);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
