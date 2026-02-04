package registro.cargarDatos.services;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.exceptions.CsvValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import registro.cargarDatos.dtos.ArchivoCargaResponse;
import registro.cargarDatos.models.*;
import registro.services.AdministracionService;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacturaArchivoService {

    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd")
    );

    private final FacturaService facturaService;
    private final AdministracionService administracionService;

    public ArchivoCargaResponse procesarArchivo(MultipartFile file, String usuarioSub) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo está vacío.");
        }

        Long organizacionId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        String filename = Optional.ofNullable(file.getOriginalFilename()).orElse("");
        String contentType = Optional.ofNullable(file.getContentType()).orElse("").toLowerCase(Locale.ROOT);
        boolean esCsv = filename.toLowerCase(Locale.ROOT).endsWith(".csv")
                || contentType.contains("csv")
                || "text/plain".equals(contentType);

        List<ArchivoCargaResponse.ArchivoError> errores = new ArrayList<>();
        int totalFilas = 0;
        int registrosCargados = 0;

        if (esCsv) {
            try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
                 CSVReader csvReader = new CSVReaderBuilder(reader).build()) {

                String[] header = csvReader.readNext();
                if (header == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo CSV no contiene encabezados.");
                }

                Map<Integer, String> columnas = buildHeaderIndex(header);
                String[] row;
                int lineNumber = 1; // encabezado

                while ((row = csvReader.readNext()) != null) {
                    lineNumber++;
                    Map<String, String> valores = extractValues(row, columnas);

                    if (isRowEmpty(valores)) {
                        continue;
                    }

                    totalFilas++;
                    try {
                        Factura factura = construirFactura(valores, usuarioSub, organizacionId, lineNumber);
                        facturaService.guardarFactura(factura);
                        registrosCargados++;
                    } catch (IllegalArgumentException ex) {
                        errores.add(ArchivoCargaResponse.ArchivoError.builder()
                                .fila(lineNumber)
                                .mensaje(ex.getMessage())
                                .build());
                        log.debug("Error en fila {} del CSV: {}", lineNumber, ex.getMessage());
                    }
                }

            } catch (IOException | CsvValidationException e) {
                log.error("Error al leer CSV de facturas: {}", e.getMessage());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el archivo CSV.", e);
            }
        } else {
            try (InputStream inputStream = file.getInputStream();
                 Workbook workbook = WorkbookFactory.create(inputStream)) {

                Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
                if (sheet == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo Excel no contiene hojas.");
                }

                Row headerRow = sheet.getRow(0);
                if (headerRow == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo Excel no contiene encabezados.");
                }

                DataFormatter formatter = new DataFormatter();
                Map<Integer, String> columnas = buildHeaderIndex(headerRow, formatter);

                for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                    Row row = sheet.getRow(i);
                    if (row == null) {
                        continue;
                    }

                    Map<String, String> valores = extractValues(row, columnas, formatter);
                    if (isRowEmpty(valores)) {
                        continue;
                    }

                    int lineNumber = i + 1; // Excel es 1-based
                    totalFilas++;

                    try {
                        Factura factura = construirFactura(valores, usuarioSub, organizacionId, lineNumber);
                        facturaService.guardarFactura(factura);
                        registrosCargados++;
                    } catch (IllegalArgumentException ex) {
                        errores.add(ArchivoCargaResponse.ArchivoError.builder()
                                .fila(lineNumber)
                                .mensaje(ex.getMessage())
                                .build());
                        log.debug("Error en fila {} del Excel: {}", lineNumber, ex.getMessage());
                    }
                }

            } catch (IOException e) {
                log.error("Error al leer Excel de facturas: {}", e.getMessage());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el archivo Excel.", e);
            }
        }

        return ArchivoCargaResponse.builder()
                .totalFilas(totalFilas)
                .registrosCargados(registrosCargados)
                .errores(errores)
                .build();
    }

    private Factura construirFactura(Map<String, String> valores,
                                     String usuarioSub,
                                     Long organizacionId,
                                     int lineNumber) {

        Factura factura = new Factura();
        factura.setUsuarioId(usuarioSub);
        factura.setOrganizacionId(organizacionId);
        factura.setTipoDocumento("Factura");

        factura.setNumeroDocumento(obtenerCampoObligatorio(valores, lineNumber, "numero_documento", "numero", "nro"));
        factura.setTipoFactura(obtenerCampoObligatorio(valores, lineNumber, "tipo_factura", "tipo"));
        LocalDate fechaEmisionLocal = parseFechaObligatoria(
                firstNonBlank(valores, "fecha_emision", "fecha"),
                lineNumber,
                "fecha_emision");
        // Factura.fechaEmision ahora es LocalDateTime: usar inicio de día al guardar desde archivo
        factura.setFechaEmision(fechaEmisionLocal != null ? fechaEmisionLocal.atStartOfDay() : null);
        factura.setMontoTotal(parseMontoObligatorio(
                firstNonBlank(valores, "monto_total", "monto", "importe"),
                lineNumber));
        factura.setMoneda(parseMoneda(firstNonBlank(valores, "moneda", "divisa")));
        factura.setCategoria(firstNonBlank(valores, "categoria", "rubro"));
        factura.setDescripcion(firstNonBlank(valores, "descripcion", "descripción", "detalle", "concepto"));
        factura.setEstadoDocumentoComercial(parseEstadoDocumento(firstNonBlank(valores, "estado_documento", "estado_documento_comercial")));
        factura.setVersionDocumento(parseVersionDocumento(firstNonBlank(valores, "version_documento", "version")));
        factura.setEstadoPago(parseEstadoPago(firstNonBlank(valores, "estado_pago", "pago_estado")));

        factura.setVendedorNombre(firstNonBlank(valores, "vendedor_nombre", "vendedor"));
        factura.setVendedorCuit(firstNonBlank(valores, "vendedor_cuit", "cuit_vendedor"));
        factura.setVendedorCondicionIVA(firstNonBlank(valores, "vendedor_condicion_iva", "vendedor_condicioniva"));
        factura.setVendedorDomicilio(firstNonBlank(valores, "vendedor_domicilio", "domicilio_vendedor"));

        factura.setCompradorNombre(firstNonBlank(valores, "comprador_nombre", "comprador", "cliente_nombre"));
        factura.setCompradorCuit(firstNonBlank(valores, "comprador_cuit", "cuit_comprador", "cliente_cuit"));
        factura.setCompradorCondicionIVA(firstNonBlank(valores, "comprador_condicion_iva", "comprador_condicioniva"));
        factura.setCompradorDomicilio(firstNonBlank(valores, "comprador_domicilio", "domicilio_comprador"));

        if (!StringUtils.hasText(factura.getVendedorNombre()) && organizacionId != null) {
            log.debug("Factura fila {} sin vendedor_nombre; EmpresaDataService completará si corresponde.", lineNumber);
        }

        return factura;
    }

    private Map<Integer, String> buildHeaderIndex(String[] header) {
        Map<Integer, String> columnas = new LinkedHashMap<>();
        for (int i = 0; i < header.length; i++) {
            String nombre = normalizeHeader(header[i]);
            if (StringUtils.hasText(nombre)) {
                columnas.put(i, nombre);
            }
        }
        if (columnas.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se detectaron columnas válidas en el encabezado.");
        }
        return columnas;
    }

    private Map<Integer, String> buildHeaderIndex(Row headerRow, DataFormatter formatter) {
        Map<Integer, String> columnas = new LinkedHashMap<>();
        for (Cell cell : headerRow) {
            if (cell == null) {
                continue;
            }
            String valor = normalizeHeader(formatter.formatCellValue(cell));
            if (StringUtils.hasText(valor)) {
                columnas.put(cell.getColumnIndex(), valor);
            }
        }
        if (columnas.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se detectaron columnas válidas en el encabezado.");
        }
        return columnas;
    }

    private Map<String, String> extractValues(String[] row, Map<Integer, String> columnas) {
        Map<String, String> valores = new HashMap<>();
        for (Map.Entry<Integer, String> entry : columnas.entrySet()) {
            int index = entry.getKey();
            String valor = index < row.length ? row[index] : "";
            if (valor != null) {
                valor = valor.trim();
            }
            valores.put(entry.getValue(), valor);
        }
        return valores;
    }

    private Map<String, String> extractValues(Row row,
                                              Map<Integer, String> columnas,
                                              DataFormatter formatter) {
        Map<String, String> valores = new HashMap<>();
        for (Map.Entry<Integer, String> entry : columnas.entrySet()) {
            Cell cell = row.getCell(entry.getKey(), Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            String valor = cell != null ? formatter.formatCellValue(cell) : "";
            if (valor != null) {
                valor = valor.trim();
            }
            valores.put(entry.getValue(), valor);
        }
        return valores;
    }

    private boolean isRowEmpty(Map<String, String> valores) {
        return valores.values().stream().allMatch(value -> !StringUtils.hasText(value));
    }

    private String normalizeHeader(String header) {
        if (!StringUtils.hasText(header)) {
            return "";
        }
        return header
                .trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[\\s]+", "_");
    }

    private String firstNonBlank(Map<String, String> valores, String... keys) {
        for (String key : keys) {
            String value = valores.get(key);
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private String obtenerCampoObligatorio(Map<String, String> valores,
                                           int lineNumber,
                                           String... keys) {
        String value = firstNonBlank(valores, keys);
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(
                    String.format("La columna '%s' es obligatoria en la fila %d",
                            keys[0], lineNumber));
        }
        return value;
    }

    private LocalDate parseFechaObligatoria(String valor, int lineNumber, String campo) {
        LocalDate fecha = parseFecha(valor);
        if (fecha == null) {
            throw new IllegalArgumentException(
                    String.format("La columna '%s' es obligatoria o tiene un formato inválido en la fila %d",
                            campo, lineNumber));
        }
        return fecha;
    }

    private LocalDate parseFecha(String valor) {
        if (!StringUtils.hasText(valor)) {
            return null;
        }
        String normalizado = valor.trim();
        for (DateTimeFormatter formatter : DATE_FORMATS) {
            try {
                return LocalDate.parse(normalizado, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }

    private Double parseMontoObligatorio(String valor, int lineNumber) {
        Double monto = parseMonto(valor);
        if (monto == null) {
            throw new IllegalArgumentException(
                    String.format("El monto es obligatorio o tiene un formato inválido en la fila %d", lineNumber));
        }
        return monto;
    }

    private Double parseMonto(String valor) {
        if (!StringUtils.hasText(valor)) {
            return null;
        }
        String normalizado = valor.trim().replace(" ", "");
        if (normalizado.contains(",") && normalizado.contains(".")) {
            if (normalizado.lastIndexOf('.') > normalizado.lastIndexOf(',')) {
                normalizado = normalizado.replace(",", "");
            } else {
                normalizado = normalizado.replace(".", "").replace(",", ".");
            }
        } else if (normalizado.contains(",")) {
            normalizado = normalizado.replace(",", ".");
        }
        normalizado = normalizado.replaceAll("[^0-9\\-\\.]", "");
        if (!StringUtils.hasText(normalizado)) {
            return null;
        }
        try {
            return Double.parseDouble(normalizado);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private TipoMoneda parseMoneda(String valor) {
        if (!StringUtils.hasText(valor)) {
            return TipoMoneda.ARS;
        }
        try {
            return TipoMoneda.fromString(valor.trim());
        } catch (IllegalArgumentException ex) {
            return TipoMoneda.ARS;
        }
    }

    private EstadoDocumentoComercial parseEstadoDocumento(String valor) {
        if (!StringUtils.hasText(valor)) {
            return EstadoDocumentoComercial.PagoPendiente;
        }
        return Arrays.stream(EstadoDocumentoComercial.values())
                .filter(estado -> estado.name().equalsIgnoreCase(valor.trim()))
                .findFirst()
                .orElse(EstadoDocumentoComercial.PagoPendiente);
    }

    private VersionDocumento parseVersionDocumento(String valor) {
        if (!StringUtils.hasText(valor)) {
            return VersionDocumento.Original;
        }
        return Arrays.stream(VersionDocumento.values())
                .filter(version -> version.name().equalsIgnoreCase(valor.trim()))
                .findFirst()
                .orElse(VersionDocumento.Original);
    }

    private EstadoPago parseEstadoPago(String valor) {
        if (!StringUtils.hasText(valor)) {
            return EstadoPago.NO_PAGADO;
        }
        return Arrays.stream(EstadoPago.values())
                .filter(estado -> estado.name().equalsIgnoreCase(valor.trim()))
                .findFirst()
                .orElse(EstadoPago.NO_PAGADO);
    }
}


