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
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import registro.cargarDatos.dtos.ImageAutocompletarResponse;
import registro.cargarDatos.services.DocumentoConversionService;
import registro.cargarDatos.services.VertexImageScannerService;

import java.util.Collections;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/carga-datos/facturas")
public class FacturaDocumentoAiController {

    private final DocumentoConversionService documentoConversionService;
    private final VertexImageScannerService vertexImageScannerService;

    @PostMapping(value = "/documento", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageAutocompletarResponse> procesarFacturaDocumento(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {

        log.info("Procesando documento de factura (IA) para usuario {}. Archivo: {}", usuarioSub, file.getOriginalFilename());
        String texto;
        try {
            texto = documentoConversionService.extractText(file);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(BAD_REQUEST, ex.getMessage());
        }

        if (!StringUtils.hasText(texto)) {
            ImageAutocompletarResponse response = ImageAutocompletarResponse.builder()
                    .rawText("")
                    .campos(Collections.emptyMap())
                    .warnings(Collections.singletonList("No se encontró texto legible en el documento."))
                    .build();
            return ResponseEntity.ok(response);
        }

        VertexImageScannerService.ImageScanResult result = vertexImageScannerService.scanText(
                texto,
                VertexImageScannerService.ScanType.FACTURA
        );

        ImageAutocompletarResponse response = ImageAutocompletarResponse.builder()
                .rawText(result.rawText())
                .campos(result.campos())
                .warnings(result.warnings())
                .build();

        return ResponseEntity.ok(response);
    }
}
