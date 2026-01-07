package registro.cargarDatos.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import registro.cargarDatos.dtos.ArchivoCargaResponse;
import registro.cargarDatos.models.TipoMovimiento;
import registro.cargarDatos.services.MovimientoArchivoService;

@RestController
@RequestMapping("/movimientos")
@RequiredArgsConstructor
@Slf4j
public class MovimientoArchivoController {

    private final MovimientoArchivoService movimientoArchivoService;

    @PostMapping(value = "/{tipo}/documento", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ArchivoCargaResponse> cargarDocumentoPorTipo(
            @PathVariable("tipo") String tipo,
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        TipoMovimiento tipoMovimiento = parseTipoMovimiento(tipo);
        log.info("Procesando carga masiva de movimientos tipo {} para usuario {}", tipoMovimiento, usuarioSub);
        ArchivoCargaResponse response = movimientoArchivoService
                .procesarArchivo(tipoMovimiento, file, usuarioSub);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/documento", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ArchivoCargaResponse> cargarDocumentoGenerico(
            @RequestParam("tipoMovimiento") String tipoMovimiento,
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        TipoMovimiento tipo = parseTipoMovimiento(tipoMovimiento);
        log.info("Procesando carga masiva (genérica) de movimientos tipo {} para usuario {}", tipo, usuarioSub);
        ArchivoCargaResponse response = movimientoArchivoService
                .procesarArchivo(tipo, file, usuarioSub);
        return ResponseEntity.ok(response);
    }

    private TipoMovimiento parseTipoMovimiento(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Debe indicar el tipo de movimiento.");
        }

        String normalizado = valor.trim();
        return java.util.Arrays.stream(TipoMovimiento.values())
                .filter(tm -> tm.name().equalsIgnoreCase(normalizado))
                .findFirst()
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Tipo de movimiento no reconocido: " + valor));
    }
}


