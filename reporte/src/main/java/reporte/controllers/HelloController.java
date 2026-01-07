package reporte.controllers;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@RestController
public class HelloController {

    @Value("${mycfo.registro.url}")
    private String registroUrl;

    @GetMapping("/reporte")
    public String hello() {
        return "Hola desde reporte";
    }


    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/reporte/llamar-registro")
    public String llamarRegistro() {
        String registroBaseUrl;
        String url = UriComponentsBuilder
                .fromUri(URI.create(registroUrl))
                .path("/registro")
                .toUriString();

        return restTemplate.getForObject(url, String.class);
    }
}

