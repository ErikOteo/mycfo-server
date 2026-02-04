package notificacion.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import notificacion.services.SolicitudAccesoEmailService;

import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class SolicitudAccesoController {

    private final SolicitudAccesoEmailService solicitudAccesoEmailService;

    @PostMapping("/solicitar-acceso")
    public ResponseEntity<?> solicitarAcceso(
            @RequestHeader(value = "X-Usuario-Sub", required = false) String subColaborador,
            @RequestBody Map<String, String> body) {

        try {
            System.out.println("📩 [SOLICITUD-ACCESO] Iniciando solicitud. Header Sub: " + subColaborador);

            if (subColaborador == null || subColaborador.isEmpty()) {
                System.err.println("❌ [SOLICITUD-ACCESO] Error: X-Usuario-Sub is missing");
                return ResponseEntity.badRequest().body("Header X-Usuario-Sub is missing");
            }

            String nombre = body.get("nombre");
            String email = body.get("email");

            System.out.println("👤 [SOLICITUD-ACCESO] Colaborador: " + nombre + " <" + email + ">");

            solicitudAccesoEmailService.notificarSolicitudAcceso(subColaborador, nombre, email);

            System.out.println("✅ [SOLICITUD-ACCESO] Notificación completada con éxito");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("❌ [SOLICITUD-ACCESO] Error en la operación: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
