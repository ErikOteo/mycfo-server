package registro.cargarDatos.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import registro.cargarDatos.dtos.ImageAutocompletarResponse;
import registro.cargarDatos.services.VertexImageScannerService;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequiredArgsConstructor
@Slf4j
public class FotoCargaController {

    private final VertexImageScannerService vertexImageScannerService;

    @PostMapping(value = "/facturas/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageAutocompletarResponse> procesarFacturaFoto(
            @RequestParam("files") List<MultipartFile> files,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        long start = System.nanoTime();
        MultipartFile archivo = seleccionarArchivo(files);
        log.info("Recibida foto de factura. Usuario: {}, Archivo: {}, Total archivos: {}", usuarioSub, archivo.getOriginalFilename(), files.size());

        VertexImageScannerService.ImageScanResult result = vertexImageScannerService.scanImage(
                readBytes(archivo),
                resolverMimeType(archivo),
                VertexImageScannerService.ScanType.FACTURA
        );

        ImageAutocompletarResponse response = ImageAutocompletarResponse.builder()
                .rawText(result.rawText())
                .campos(result.campos())
                .warnings(result.warnings())
                .build();

        log.info("Respuesta de factura preparada en {} ms. Campos: {}, Warnings: {}",
                nanosToMillis(System.nanoTime() - start),
                response.getCampos() != null ? response.getCampos().size() : 0,
                response.getWarnings() != null ? response.getWarnings().size() : 0);

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/movimientos/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageAutocompletarResponse> procesarMovimientoFoto(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "tipoMovimiento", required = false) String tipoMovimientoParam,
            @RequestParam(value = "tipoDoc", required = false) String tipoDocParam,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        long start = System.nanoTime();
        MultipartFile archivo = seleccionarArchivo(files);
        VertexImageScannerService.ScanType tipo = resolverTipoMovimiento(tipoMovimientoParam, tipoDocParam);
        log.info("Recibida foto de movimiento tipo {}. Usuario: {}, Archivo: {}, Total archivos: {}", tipo, usuarioSub, archivo.getOriginalFilename(), files.size());

        VertexImageScannerService.ImageScanResult result = vertexImageScannerService.scanImage(
                readBytes(archivo),
                resolverMimeType(archivo),
                tipo
        );

        ImageAutocompletarResponse response = ImageAutocompletarResponse.builder()
                .rawText(result.rawText())
                .campos(result.campos())
                .warnings(result.warnings())
                .build();

        log.info("Respuesta de movimiento preparada en {} ms. Campos: {}, Warnings: {}",
                nanosToMillis(System.nanoTime() - start),
                response.getCampos() != null ? response.getCampos().size() : 0,
                response.getWarnings() != null ? response.getWarnings().size() : 0);

        return ResponseEntity.ok(response);
    }

    private MultipartFile seleccionarArchivo(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "No se envio ninguna imagen.");
        }
        return files.get(0);
    }

    private byte[] readBytes(MultipartFile archivo) {
        try {
            return archivo.getBytes();
        } catch (Exception ex) {
            throw new ResponseStatusException(BAD_REQUEST, "No se pudo leer la imagen.");
        }
    }

    private String resolverMimeType(MultipartFile archivo) {
        String contentType = archivo.getContentType();
        if (StringUtils.hasText(contentType)) {
            return contentType;
        }
        String filename = archivo.getOriginalFilename();
        if (filename != null) {
            String lower = filename.toLowerCase();
            if (lower.endsWith(".png")) {
                return "image/png";
            }
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                return "image/jpeg";
            }
            if (lower.endsWith(".webp")) {
                return "image/webp";
            }
        }
        return "image/jpeg";
    }

    private VertexImageScannerService.ScanType resolverTipoMovimiento(String tipoMovimientoParam, String tipoDocParam) {
        String valor = (tipoMovimientoParam != null && !tipoMovimientoParam.isBlank())
                ? tipoMovimientoParam
                : tipoDocParam;
        if (valor == null || valor.isBlank()) {
            return VertexImageScannerService.ScanType.MOVIMIENTO;
        }
        String normalizado = valor.trim().toLowerCase();
        return switch (normalizado) {
            case "ingreso" -> VertexImageScannerService.ScanType.INGRESO;
            case "egreso" -> VertexImageScannerService.ScanType.EGRESO;
            case "deuda" -> VertexImageScannerService.ScanType.DEUDA;
            case "acreencia" -> VertexImageScannerService.ScanType.ACREENCIA;
            case "movimiento", "movimientos" -> VertexImageScannerService.ScanType.MOVIMIENTO;
            default -> VertexImageScannerService.ScanType.MOVIMIENTO;
        };
    }

    private long nanosToMillis(long nanos) {
        return Math.round(nanos / 1_000_000.0);
    }
}
