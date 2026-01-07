package notificacion.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invitaciones")
@RequiredArgsConstructor
public class InvitacionController {

    private final notificacion.services.InvitacionEmailService invitacionEmailService;

    @PostMapping("/enviar")
    public ResponseEntity<Void> enviarInvitaciones(
            @RequestHeader(value = "X-Usuario-Sub") String subUsuarioInvitador,
            @RequestBody List<String> emails) {
        
        try {
            invitacionEmailService.enviarInvitaciones(emails, subUsuarioInvitador);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
