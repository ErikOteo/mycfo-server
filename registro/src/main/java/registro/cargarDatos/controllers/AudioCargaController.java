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
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import registro.cargarDatos.services.VertexAudioScannerService;

import java.util.Locale;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/carga-datos")
public class AudioCargaController {

    private final VertexAudioScannerService vertexAudioScannerService;

    @PostMapping(value = "/movimientos/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AudioAutocompletarResponse> procesarMovimientoAudio(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tipoMovimiento", required = false) String tipoMovimientoParam,
            @RequestParam(value = "tipoDoc", required = false) String tipoDocParam,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        long start = System.nanoTime();
        VertexAudioScannerService.ScanType tipo = resolverTipoMovimiento(tipoMovimientoParam, tipoDocParam);
        log.info("Recibido audio de movimiento tipo {}. Usuario: {}, Archivo: {}", tipo, usuarioSub, file.getOriginalFilename());

        VertexAudioScannerService.AudioScanResult result = vertexAudioScannerService.scanAudio(
                readBytes(file),
                resolverMimeType(file),
                tipo
        );

        AudioAutocompletarResponse response = AudioAutocompletarResponse.builder()
                .transcript(result.rawText())
                .campos(result.campos())
                .warnings(result.warnings())
                .build();

        log.info("Respuesta de movimiento preparada en {} ms. Campos: {}, Warnings: {}",
                nanosToMillis(System.nanoTime() - start),
                response.getCampos() != null ? response.getCampos().size() : 0,
                response.getWarnings() != null ? response.getWarnings().size() : 0);

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/facturas/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AudioAutocompletarResponse> procesarFacturaAudio(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        long start = System.nanoTime();
        log.info("Recibido audio de factura. Usuario: {}, Archivo: {}", usuarioSub, file.getOriginalFilename());

        VertexAudioScannerService.AudioScanResult result = vertexAudioScannerService.scanAudio(
                readBytes(file),
                resolverMimeType(file),
                VertexAudioScannerService.ScanType.FACTURA
        );

        AudioAutocompletarResponse response = AudioAutocompletarResponse.builder()
                .transcript(result.rawText())
                .campos(result.campos())
                .warnings(result.warnings())
                .build();

        log.info("Respuesta de factura preparada en {} ms. Campos: {}, Warnings: {}",
                nanosToMillis(System.nanoTime() - start),
                response.getCampos() != null ? response.getCampos().size() : 0,
                response.getWarnings() != null ? response.getWarnings().size() : 0);

        return ResponseEntity.ok(response);
    }

    private VertexAudioScannerService.ScanType resolverTipoMovimiento(String tipoMovimientoParam, String tipoDocParam) {
        String valor = (tipoMovimientoParam != null && !tipoMovimientoParam.isBlank())
                ? tipoMovimientoParam
                : tipoDocParam;
        if (valor == null || valor.isBlank()) {
            return VertexAudioScannerService.ScanType.MOVIMIENTO;
        }
        String normalizado = valor.trim().toLowerCase(Locale.ROOT);
        return switch (normalizado) {
            case "ingreso" -> VertexAudioScannerService.ScanType.INGRESO;
            case "egreso" -> VertexAudioScannerService.ScanType.EGRESO;
            case "deuda" -> VertexAudioScannerService.ScanType.DEUDA;
            case "acreencia" -> VertexAudioScannerService.ScanType.ACREENCIA;
            case "movimiento", "movimientos" -> VertexAudioScannerService.ScanType.MOVIMIENTO;
            default -> {
                log.warn("Tipo de movimiento {} no reconocido, se procedera como movimiento general.", valor);
                yield VertexAudioScannerService.ScanType.MOVIMIENTO;
            }
        };
    }

    private byte[] readBytes(MultipartFile archivo) {
        try {
            return archivo.getBytes();
        } catch (Exception ex) {
            throw new ResponseStatusException(BAD_REQUEST, "No se pudo leer el audio.");
        }
    }

    private String resolverMimeType(MultipartFile archivo) {
        String contentType = archivo.getContentType();
        if (StringUtils.hasText(contentType)) {
            return contentType;
        }
        String filename = archivo.getOriginalFilename();
        if (filename != null) {
            String lower = filename.toLowerCase(Locale.ROOT);
            if (lower.endsWith(".webm")) {
                return "audio/webm";
            }
            if (lower.endsWith(".mp3")) {
                return "audio/mpeg";
            }
            if (lower.endsWith(".wav")) {
                return "audio/wav";
            }
            if (lower.endsWith(".ogg")) {
                return "audio/ogg";
            }
            if (lower.endsWith(".m4a") || lower.endsWith(".mp4")) {
                return "audio/mp4";
            }
            if (lower.endsWith(".flac")) {
                return "audio/flac";
            }
            if (lower.endsWith(".amr")) {
                return "audio/amr";
            }
        }
        return "audio/mpeg";
    }

    private long nanosToMillis(long nanos) {
        return Math.round(nanos / 1_000_000.0);
    }
}

