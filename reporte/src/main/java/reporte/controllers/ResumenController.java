package reporte.controllers;

import org.springframework.web.bind.annotation.*;
import reporte.dtos.ResumenMensualDTO;
import reporte.services.ResumenService;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/resumen")
public class ResumenController {

    private final ResumenService resumenService;

    public ResumenController(ResumenService resumenService) {
        this.resumenService = resumenService;
    }

    @GetMapping
    public ResumenMensualDTO obtenerResumen(
            @RequestParam int anio,
            @RequestParam int mes,
            // Soporta: ?categoria=A&categoria=B o ?categoria=A,B
            @RequestParam(required = false, name = "categoria") List<String> categoriaParam,
            @RequestHeader(value = "X-Usuario-Sub") String userSub
    ) {
        List<String> categorias = (categoriaParam == null ? Collections.emptyList() :
                categoriaParam.stream()
                        .filter(Objects::nonNull)
                        .flatMap(s -> Arrays.stream(s.split(",")))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .distinct()
                        .collect(Collectors.toList())
        );

        return resumenService.obtenerResumenMensual(anio, mes, categorias, userSub);
    }
}
