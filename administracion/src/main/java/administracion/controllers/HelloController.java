package administracion.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import administracion.dtos.UsuarioDTO;
import administracion.services.UsuarioService;

@RestController
@RequiredArgsConstructor
public class HelloController {
    
    @Value("${server.port:8081}")
    private String port;
    
    private final UsuarioService usuarioService;
    
    @GetMapping("/administracion")
    public String hello() {
        return "Hola desde administracion - puerto " + port;
    }
    
    @GetMapping("/test")
    public String test() {
        return "Test endpoint funcionando - puerto " + port;
    }
    
    @GetMapping("/api/usuarios/perfil-test")
    public ResponseEntity<UsuarioDTO> testPerfil(@RequestHeader(value = "X-Usuario-Sub") String sub) {
        try {
            UsuarioDTO usuario = usuarioService.obtenerUsuarioPorSub(sub);
            return ResponseEntity.ok(usuario);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
