package registro.cargarDatos.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import registro.cargarDatos.dtos.AudioAutocompletarResponse;
import registro.cargarDatos.models.TipoMovimiento;
import registro.cargarDatos.services.AudioTranscripcionService;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/carga-datos")
public class AudioCargaController {

    private final AudioTranscripcionService audioTranscripcionService;

    @PostMapping(value = "/movimientos/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AudioAutocompletarResponse> procesarMovimientoAudio(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tipoMovimiento", required = false) String tipoMovimientoParam,
            @RequestParam(value = "tipoDoc", required = false) String tipoDocParam,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        TipoMovimiento tipoMovimiento = resolverTipoMovimiento(tipoMovimientoParam, tipoDocParam);
        log.info("Recibido audio para movimiento tipo {} del usuario {}", tipoMovimiento, usuarioSub);
        AudioAutocompletarResponse response = audioTranscripcionService.procesarMovimientoAudio(file, tipoMovimiento, usuarioSub);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/facturas/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AudioAutocompletarResponse> procesarFacturaAudio(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        log.info("Recibido audio para factura del usuario {}", usuarioSub);
        AudioAutocompletarResponse response = audioTranscripcionService.procesarFacturaAudio(file, usuarioSub);
        return ResponseEntity.ok(response);
    }

    private TipoMovimiento resolverTipoMovimiento(String tipoMovimientoParam, String tipoDocParam) {
        String valor = (tipoMovimientoParam != null && !tipoMovimientoParam.isBlank())
                ? tipoMovimientoParam
                : tipoDocParam;
        if (valor == null || valor.isBlank()) {
            return null;
        }
        String normalizado = valor.trim().toLowerCase();
        switch (normalizado) {
            case "ingreso":
                return TipoMovimiento.Ingreso;
            case "egreso":
                return TipoMovimiento.Egreso;
            case "deuda":
                return TipoMovimiento.Deuda;
            case "acreencia":
                return TipoMovimiento.Acreencia;
            case "movimiento":
            case "movimientos":
                return null;
            default:
                log.warn("Tipo de movimiento {} no reconocido, se procederá sin tipo específico.", valor);
                return null;
        }
    }
}

