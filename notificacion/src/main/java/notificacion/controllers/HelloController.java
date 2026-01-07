package notificacion.controllers;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    @GetMapping("/notificacion")
    public String hello() {
        return "Hola desde notificacion";
    }
}
