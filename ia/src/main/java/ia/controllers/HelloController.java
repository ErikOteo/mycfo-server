package ia.controllers;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    @GetMapping("/ia")
    public String hello() {
        return "Hola desde ia";
    }
}
