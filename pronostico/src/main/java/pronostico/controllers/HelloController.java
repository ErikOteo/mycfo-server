package pronostico.controllers;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    @GetMapping("/pronostico")
    public String hello() {
        return "Hola desde pronostico";
    }
}
