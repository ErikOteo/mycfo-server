package registro.cargarDatos.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import registro.cargarDatos.dtos.ArchivoCargaResponse;
import registro.cargarDatos.services.FacturaArchivoService;

@RestController
@RequestMapping("/facturas")
@RequiredArgsConstructor
@Slf4j
public class FacturaArchivoController {

    private final FacturaArchivoService facturaArchivoService;

    @PostMapping(value = "/documento", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ArchivoCargaResponse> cargarFacturasPorArchivo(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        log.info("Procesando carga masiva de facturas para usuario {}", usuarioSub);
        ArchivoCargaResponse response = facturaArchivoService.procesarArchivo(file, usuarioSub);
        return ResponseEntity.ok(response);
    }
}


