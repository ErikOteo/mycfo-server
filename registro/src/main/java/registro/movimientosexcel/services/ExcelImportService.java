package registro.movimientosexcel.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import registro.movimientosexcel.dtos.*;
import registro.cargarDatos.models.Movimiento;
import registro.cargarDatos.models.TipoMedioPago;
import registro.cargarDatos.models.TipoMoneda;
import registro.cargarDatos.models.TipoMovimiento;
import registro.cargarDatos.repositories.MovimientoRepository;
import registro.movimientosexcel.models.ExcelImportHistory;
import registro.movimientosexcel.repositories.ExcelImportHistoryRepository;
import registro.services.AdministracionService;

import java.io.InputStream;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ExcelImportService {

    private static final Logger log = LoggerFactory.getLogger(ExcelImportService.class);

    @Autowired
    private MovimientoRepository movimientoRepo;

    @Autowired
    private NotificationsEventPublisher notifications;
    
    @Autowired
    private ExcelImportHistoryRepository importHistoryRepository;
    
    @Autowired
    private CategorySuggestionService categorySuggestionService;
    
    @Autowired
    private DuplicateDetectionService duplicateDetectionService;
    
    @Autowired
    private AdministracionService administracionService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumenCargaDTO procesarArchivo(MultipartFile file, String tipoOrigen, String usuarioSub, String configJson) {
        Long organizacionId = obtenerOrganizacionId(usuarioSub);
        switch (tipoOrigen.toLowerCase()) {
            case "excel-libre": return procesarExcelLibre(file, usuarioSub, organizacionId, configJson);
            case "mycfo": return procesarGenerico(file, usuarioSub, organizacionId);
            case "mercado-pago": return procesarMercadoPago(file, usuarioSub, organizacionId);
            case "galicia": return procesarGalicia(file, usuarioSub, organizacionId);
            case "nacion": return procesarNacion(file, usuarioSub, organizacionId);
            case "uala": return procesarUala(file, usuarioSub, organizacionId);
            case "santander": return procesarSantander(file, usuarioSub, organizacionId);
            default: throw new IllegalArgumentException("Tipo de origen no soportado: " + tipoOrigen);
        }
    }
    
    public PreviewDataDTO procesarArchivoParaPreview(MultipartFile file, String tipoOrigen, String usuarioSub, String configJson) {
        Long organizacionId = obtenerOrganizacionId(usuarioSub);
        switch (tipoOrigen.toLowerCase()) {
            case "excel-libre": return procesarExcelLibreParaPreview(file, organizacionId, configJson);
            case "mycfo": return procesarGenericoParaPreview(file, organizacionId);
            case "mercado-pago": return procesarMercadoPagoParaPreview(file, organizacionId);
            case "galicia": return procesarGaliciaParaPreview(file, organizacionId);
            case "nacion": return procesarNacionParaPreview(file, organizacionId);
            case "uala": return procesarUalaParaPreview(file, organizacionId);
            case "santander": return procesarSantanderParaPreview(file, organizacionId);
            default: throw new IllegalArgumentException("Tipo de origen no soportado: " + tipoOrigen);
        }
    }
    
    public ResumenCargaDTO guardarRegistrosSeleccionados(SaveSelectedRequestDTO request, String usuarioSub) {
        List<RegistroPreviewDTO> registrosSeleccionados = request.getRegistrosSeleccionados();
        int totalGuardados = 0;
        List<FilaConErrorDTO> errores = new ArrayList<>();
        Long organizacionId = obtenerOrganizacionId(usuarioSub);
        java.util.UUID usuarioUuid = parseUsuarioUuid(usuarioSub);
        
        // Crear historial de importación
        ExcelImportHistory history = new ExcelImportHistory();
        history.setFileName(request.getFileName());
        history.setTipoOrigen(request.getTipoOrigen());
        history.setTotalRegistros(registrosSeleccionados.size());
        history.setUsuario(usuarioUuid);
        
        try {
            for (RegistroPreviewDTO preview : registrosSeleccionados) {
                try {
                    Movimiento movimiento = convertirPreviewAMovimiento(preview);
                    enriquecerConContexto(movimiento, usuarioSub, organizacionId);
                    
                    // Normalizar monto según tipo
                    normalizarMontoMovimiento(movimiento);
                    
                    movimientoRepo.save(movimiento);
                    totalGuardados++;
                    notifications.publishMovement(movimiento, usuarioSub, 1L);
                    
                } catch (Exception e) {
                    errores.add(new FilaConErrorDTO(preview.getFilaExcel(), e.getMessage()));
                }
            }
            
            history.setRegistrosProcesados(registrosSeleccionados.size());
            history.setRegistrosGuardados(totalGuardados);
            history.setEstado(totalGuardados == registrosSeleccionados.size() ? "COMPLETADO" : "PARCIAL");
            
        } catch (Exception e) {
            history.setEstado("ERROR");
            history.setObservaciones("Error general: " + e.getMessage());
        }
        
        importHistoryRepository.save(history);

        // Notificar importación exitosa si hubo al menos un registro guardado y sin errores
        Integer guardados = history.getRegistrosGuardados();
        boolean sinErrores = errores.isEmpty();
        if (guardados != null && guardados > 0 && sinErrores) {
            notifications.publishImport(
                    String.valueOf(history.getId()),
                    history.getTipoOrigen(),
                    history.getTipoOrigen(),
                    request.getFileName(),
                    guardados,
                    usuarioSub
            );
        }
        
        return new ResumenCargaDTO(registrosSeleccionados.size(), totalGuardados, errores);
    }
    
    public java.util.List<ExcelImportHistory> obtenerHistorialCargas(String usuarioSub) {
        java.util.UUID usuarioUuid = parseUsuarioUuid(usuarioSub);
        if (usuarioUuid == null) {
            return java.util.Collections.emptyList();
        }
        return importHistoryRepository.findByUsuarioOrderByFechaImportacionDesc(usuarioUuid);
    }

    /** Carga genérica de registros desde MyCFO */
    private ResumenCargaDTO procesarGenerico(MultipartFile file, String usuarioSub, Long organizacionId) {
        int total = 0;
        int correctos = 0;
        List<FilaConErrorDTO> errores = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet hoja = workbook.getSheetAt(0);

            for (int i = 1; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                total++;

                try {
                    Cell fecha = fila.getCell(1);
                    Cell descripcion = fila.getCell(2);
                    Cell monto = fila.getCell(3);
                    Cell medioPago = fila.getCell(4);

                    if (fecha == null || descripcion == null || monto == null || medioPago == null) {
                        throw new RuntimeException("Faltan datos");
                    }

                    LocalDate fechaLocal;
                    if (fecha.getCellType() == CellType.STRING) {
                        fechaLocal = LocalDate.parse(fecha.getStringCellValue(), DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    } else if (fecha.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(fecha)) {
                        fechaLocal = fecha.getLocalDateTimeCellValue().toLocalDate();
                    } else {
                        throw new RuntimeException("Formato de fecha inválido en fila " + (i + 1));
                    }

                    String descripcionStr = descripcion.getCellType() == CellType.STRING
                            ? descripcion.getStringCellValue()
                            : String.valueOf(descripcion.getNumericCellValue());

                    Double montoValor = monto.getCellType() == CellType.NUMERIC
                            ? monto.getNumericCellValue()
                            : Double.parseDouble(monto.getStringCellValue());

                    String medioPagoStr = medioPago.getCellType() == CellType.STRING
                            ? medioPago.getStringCellValue()
                            : String.valueOf(medioPago.getNumericCellValue());

                    Movimiento reg = new Movimiento();
                    reg.setTipo(determinarTipoMovimiento(montoValor));
                    reg.setMontoTotal(montoValor);
                    // Fecha de Excel solo tiene día: usar inicio de día como hora por defecto
                    reg.setFechaEmision(fechaLocal.atStartOfDay());
                    reg.setDescripcion(descripcionStr);
                    reg.setMedioPago(parseMedioPago(medioPagoStr));
                    reg.setMoneda(TipoMoneda.ARS);
                    reg.setOrigenNombre("MYCFO");
                    enriquecerConContexto(reg, usuarioSub, organizacionId);
                    
                    // Normalizar monto según tipo
                    normalizarMontoMovimiento(reg);

                    movimientoRepo.save(reg);
                    correctos++;

                } catch (Exception e) {
                    errores.add(new FilaConErrorDTO(i + 1, e.getMessage()));
                }
            }

        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo: " + e.getMessage()));
        }

        return new ResumenCargaDTO(total, correctos, errores);
    }

    private static final int HEADER_ROW_INDEX = 3;

    /** Carga de registros desde un archivo de Mercado Pago (sin id de referencia) */
    private ResumenCargaDTO procesarMercadoPago(MultipartFile file, String usuarioSub, Long organizacionId) {
        int total = 0;
        int correctos = 0;
        List<FilaConErrorDTO> errores = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet hoja = workbook.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();

            Row header = hoja.getRow(HEADER_ROW_INDEX);
            if (header == null) {
                errores.add(new FilaConErrorDTO(0, "No existe la fila de encabezados en el índice " + HEADER_ROW_INDEX));
                return new ResumenCargaDTO(total, correctos, errores);
            }

            Map<String, Integer> idx = new HashMap<>();
            for (int c = 0; c < header.getLastCellNum(); c++) {
                String v = fmt.formatCellValue(header.getCell(c)).trim().toUpperCase(Locale.ROOT);
                if (v.equals("RELEASE_DATE")) idx.put("FECHA", c);
                else if (v.equals("TRANSACTION_TYPE")) idx.put("TIPO", c);
                else if (v.equals("TRANSACTION_NET_AMOUNT")) idx.put("MONTO", c);
            }

            if (idx.size() < 3) {
                errores.add(new FilaConErrorDTO(0,
                        "Faltan columnas esperadas (RELEASE_DATE, TRANSACTION_TYPE, TRANSACTION_NET_AMOUNT)."));
                return new ResumenCargaDTO(total, correctos, errores);
            }

            for (int i = HEADER_ROW_INDEX + 1; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                if (fila == null) continue;

                try {
                    String rawFecha = fmt.formatCellValue(fila.getCell(idx.get("FECHA"))).trim();
                    String rawTipo  = fmt.formatCellValue(fila.getCell(idx.get("TIPO"))).trim();
                    String rawMonto = fmt.formatCellValue(fila.getCell(idx.get("MONTO"))).trim();

                    if (rawFecha.isEmpty() && rawTipo.isEmpty() && rawMonto.isEmpty()) continue;

                    total++;

                    if (rawFecha.isEmpty() || rawMonto.isEmpty()) {
                        throw new RuntimeException("Faltan datos obligatorios (RELEASE_DATE o TRANSACTION_NET_AMOUNT).");
                    }

                    LocalDate fechaLocal = parseFechaMercadoPago(fila.getCell(idx.get("FECHA")));
                    Double montoValor = parseMontoEsAr(rawMonto);

                    Movimiento mov = new Movimiento();
                    mov.setTipo(determinarTipoMovimiento(montoValor));
                    mov.setMontoTotal(montoValor);
                    // Fecha de MP solo tiene día: usar inicio de día como hora por defecto
                    mov.setFechaEmision(fechaLocal.atStartOfDay());
                    mov.setDescripcion(rawTipo);
                    mov.setMedioPago(parseMedioPago("Mercado Pago"));
                    mov.setMoneda(TipoMoneda.ARS);
                    mov.setOrigenNombre("MERCADO_PAGO");
                    enriquecerConContexto(mov, usuarioSub, organizacionId);
                    
                    // Normalizar monto según tipo
                    normalizarMontoMovimiento(mov);

                    movimientoRepo.save(mov);
                    correctos++;
                    notifications.publishMovement(mov, usuarioSub, 1L);

                } catch (Exception ex) {
                    errores.add(new FilaConErrorDTO(i + 1, ex.getMessage()));
                }
            }

        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo: " + e.getMessage()));
        }

        return new ResumenCargaDTO(total, correctos, errores);
    }

    private LocalDate parseFechaMercadoPago(Cell cFecha) {
        if (cFecha == null) throw new RuntimeException("Fecha vacía.");
        if (cFecha.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cFecha)) {
            return cFecha.getLocalDateTimeCellValue().toLocalDate();
        }
        String raw = new DataFormatter().formatCellValue(cFecha).trim();
        DateTimeFormatter f1 = DateTimeFormatter.ofPattern("dd-MM-uuuu");
        DateTimeFormatter f2 = DateTimeFormatter.ofPattern("uuuu-MM-dd");
        try { return LocalDate.parse(raw, f1); } catch (Exception ignore) {}
        try { return LocalDate.parse(raw, f2); } catch (Exception ignore) {}
        throw new RuntimeException("Formato de fecha inválido: " + raw);
    }

    private Double parseMontoEsAr(String raw) {
        if (raw == null) throw new RuntimeException("Monto vacío.");
        String s = raw.replace(".", "").replace(",", ".").replace("$", "").replaceAll("\\s+", "");
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Monto inválido: " + raw);
        }
    }
    private TipoMedioPago parseMedioPago(String raw) {
        if (raw == null) return null;
        String val = raw.toUpperCase(Locale.ROOT);
        // Ajustar los mapeos según tus enums reales
        if (val.contains("EFECTIVO")) return TipoMedioPago.Efectivo;
        if (val.contains("TRANSF")) return TipoMedioPago.Transferencia;
        if (val.contains("TARJ")) return TipoMedioPago.Tarjeta;
        if (val.contains("MERCADO PAGO")) return TipoMedioPago.MercadoPago;
        return TipoMedioPago.Otro;
    }
    
    private Long obtenerOrganizacionId(String usuarioSub) {
        if (usuarioSub == null || usuarioSub.isBlank()) {
            throw new IllegalArgumentException("El usuario en sesión es requerido para la carga de movimientos desde Excel");
        }
        return administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
    }
    
    private java.util.UUID parseUsuarioUuid(String usuarioSub) {
        try {
            return usuarioSub != null ? java.util.UUID.fromString(usuarioSub) : null;
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
    
    private void enriquecerConContexto(Movimiento movimiento, String usuarioSub, Long organizacionId) {
        movimiento.setUsuarioId(usuarioSub);
        movimiento.setOrganizacionId(organizacionId);
        movimiento.setFechaCreacion(LocalDateTime.now());
        movimiento.setFechaActualizacion(LocalDateTime.now());
    }

    /**
     * Importación definitiva usando el mapeo genérico.
     */
    private ResumenCargaDTO procesarExcelLibre(MultipartFile file, String usuarioSub, Long organizacionId, String configJson) {
        int total = 0;
        int correctos = 0;
        List<FilaConErrorDTO> errores = new ArrayList<>();

        ExcelLibreConfigDTO config;
        try {
            config = parseExcelLibreConfig(configJson);
        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, e.getMessage()));
            return new ResumenCargaDTO(total, correctos, errores);
        }

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet hoja = workbook.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();
            Map<String, Integer> idx = config.getColumnMap();
            int startRow = Math.max(0, (config.getDataStartRow() != null ? config.getDataStartRow() - 1 : 1));

            for (int i = startRow; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                if (fila == null) continue;

                try {
                    String rawFecha = getCellValue(fila, idx.get("fecha"), fmt);
                    String rawDesc = getCellValue(fila, idx.get("descripcion"), fmt);
                    String rawMonto = getCellValue(fila, idx.get("monto"), fmt);

                    if (rawFecha.isEmpty() && rawDesc.isEmpty() && rawMonto.isEmpty()) {
                        continue;
                    }
                    total++;

                    LocalDate fecha = parseFechaGenerica(fila.getCell(idx.get("fecha")), rawFecha, config.getDateFormat());
                    Double monto = parseMontoGenerico(rawMonto, config.getDecimalSeparator());

                    String rawTipo = getCellValue(fila, idx.get("tipo"), fmt);
                    TipoMovimiento tipo = parseTipoMovimiento(rawTipo, monto);

                    String categoria = getCellValue(fila, idx.get("categoria"), fmt);
                    String monedaStr = getCellValue(fila, idx.get("moneda"), fmt);
                    String medioPagoStr = getCellValue(fila, idx.get("mediopago"), fmt);
                    String origenStr = getCellValue(fila, idx.get("origen"), fmt);

                    Movimiento mov = new Movimiento();
                    mov.setFechaEmision(fecha.atStartOfDay());
                    mov.setDescripcion(rawDesc);
                    mov.setMontoTotal(monto);
                    mov.setTipo(tipo);
                    mov.setMoneda(parseMoneda(monedaStr));
                    mov.setMedioPago(parseMedioPago(medioPagoStr));
                    mov.setCategoria(categoria != null && !categoria.isEmpty() ? categoria : null);
                    mov.setOrigenNombre(origenStr == null || origenStr.isEmpty() ? "EXCEL_LIBRE" : origenStr);

                    enriquecerConContexto(mov, usuarioSub, organizacionId);
                    normalizarMontoMovimiento(mov);

                    movimientoRepo.save(mov);
                    correctos++;
                    notifications.publishMovement(mov, usuarioSub, 1L);

                } catch (Exception ex) {
                    errores.add(new FilaConErrorDTO(i + 1, ex.getMessage()));
                }
            }

        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo: " + e.getMessage()));
        }

        return new ResumenCargaDTO(total, correctos, errores);
    }

    private ResumenCargaDTO procesarSantander(MultipartFile file, String usuarioSub, Long organizacionId) {
        int total = 0;
        int correctos = 0;
        List<FilaConErrorDTO> errores = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet hoja = workbook.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();

            int headerIdx = buscarFilaEncabezadosSantander(hoja, fmt);
            if (headerIdx == -1) {
                errores.add(new FilaConErrorDTO(0, "No se encontraron encabezados (Fecha, Descripción, Referencia, Caja de Ahorro)"));
                return new ResumenCargaDTO(total, correctos, errores);
            }

            for (int i = headerIdx + 1; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                if (fila == null) continue;

                try {
                    String fechaStr = fmt.formatCellValue(fila.getCell(1)).trim();
                    String descripcion = fmt.formatCellValue(fila.getCell(3)).trim();
                    String refStr = fmt.formatCellValue(fila.getCell(4)).trim();
                    String cajaStr = fmt.formatCellValue(fila.getCell(5)).trim();
                    String ctaCteStr = fmt.formatCellValue(fila.getCell(6)).trim();

                    if (fechaStr.isEmpty() || descripcion.isEmpty()) {
                        continue;
                    }
                    if (descripcion.toLowerCase(Locale.ROOT).contains("saldo")) {
                        break;
                    }

                    double monto = elegirMontoSantander(cajaStr, ctaCteStr);
                    if (monto == 0) continue;
                    total++;

                    LocalDate fecha = parseFechaSantander(fechaStr);
                    Movimiento mov = new Movimiento();
                    mov.setTipo(determinarTipoMovimiento(monto));
                    mov.setMontoTotal(monto);
                    mov.setFechaEmision(fecha.atStartOfDay());
                    mov.setDescripcion(descripcion);
                    mov.setOrigenNombre("SANTANDER");
                    mov.setMedioPago(parseMedioPago("Transferencia"));
                    mov.setMoneda(TipoMoneda.ARS);
                    mov.setCategoria(refStr);
                    enriquecerConContexto(mov, usuarioSub, organizacionId);

                    normalizarMontoMovimiento(mov);
                    movimientoRepo.save(mov);
                    correctos++;
                    notifications.publishMovement(mov, usuarioSub, 1L);

                } catch (Exception ex) {
                    errores.add(new FilaConErrorDTO(i + 1, ex.getMessage()));
                }
            }

        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo: " + e.getMessage()));
        }

        return new ResumenCargaDTO(total, correctos, errores);
    }
    
    private Movimiento convertirPreviewAMovimiento(RegistroPreviewDTO preview) {
        Movimiento mov = new Movimiento();
        mov.setTipo(preview.getTipo());
        mov.setMontoTotal(preview.getMontoTotal());
        // Preview usa LocalDate, convertir a inicio de día
        mov.setFechaEmision(preview.getFechaEmision() != null ? preview.getFechaEmision().atStartOfDay() : null);
        mov.setDescripcion(preview.getDescripcion());
        mov.setOrigenNombre(preview.getOrigen()); // DTO usa 'origen' pero mapea a origenNombre
        mov.setMedioPago(preview.getMedioPago());
        mov.setMoneda(preview.getMoneda());
        mov.setCategoria(preview.getCategoriaSugerida());
        return mov;
    }
    
    private PreviewDataDTO procesarGenericoParaPreview(MultipartFile file, Long organizacionId) {
        List<RegistroPreviewDTO> registros = new ArrayList<>();
        List<FilaConErrorDTO> errores = new ArrayList<>();
        int total = 0;
        
        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet hoja = workbook.getSheetAt(0);
            
            for (int i = 1; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                if (fila == null) continue;
                
                total++;
                
                try {
                    Cell fecha = fila.getCell(1);
                    Cell descripcion = fila.getCell(2);
                    Cell monto = fila.getCell(3);
                    Cell medioPago = fila.getCell(4);
                    
                    if (fecha == null || descripcion == null || monto == null || medioPago == null) {
                        throw new RuntimeException("Faltan datos");
                    }
                    
                    LocalDate fechaLocal;
                    if (fecha.getCellType() == CellType.STRING) {
                        fechaLocal = LocalDate.parse(fecha.getStringCellValue(), DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    } else if (fecha.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(fecha)) {
                        fechaLocal = fecha.getLocalDateTimeCellValue().toLocalDate();
                    } else {
                        throw new RuntimeException("Formato de fecha inválido");
                    }
                    
                    String descripcionStr = descripcion.getCellType() == CellType.STRING
                            ? descripcion.getStringCellValue()
                            : String.valueOf(descripcion.getNumericCellValue());
                    
                    Double montoValor = monto.getCellType() == CellType.NUMERIC
                            ? monto.getNumericCellValue()
                            : Double.parseDouble(monto.getStringCellValue());
                    
                    String medioPagoStr = medioPago.getCellType() == CellType.STRING
                            ? medioPago.getStringCellValue()
                            : String.valueOf(medioPago.getNumericCellValue());
                    
                    TipoMovimiento tipoMov = determinarTipoMovimiento(montoValor);
                    RegistroPreviewDTO preview = new RegistroPreviewDTO(
                            i + 1, tipoMov, montoValor, fechaLocal, 
                            descripcionStr, "MYCFO", parseMedioPago(medioPagoStr), TipoMoneda.ARS
                    );
                    
                    // Sugerir categoría usando el tipo de registro para mejor precisión
                    preview.setCategoriaSugerida(categorySuggestionService.sugerirCategoria(descripcionStr, tipoMov));
                    
                    // Verificar duplicados
                    verificarDuplicado(preview, registros);
                    
                    registros.add(preview);
                    
                } catch (Exception e) {
                    errores.add(new FilaConErrorDTO(i + 1, e.getMessage()));
                }
            }
            
        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo: " + e.getMessage()));
        }
        
        // Detectar duplicados en la base de datos
        List<RegistroPreviewDTO> registrosConDuplicados = duplicateDetectionService.detectarDuplicadosEnBD(registros, organizacionId);
        
        return new PreviewDataDTO(registrosConDuplicados, total, registrosConDuplicados.size(), errores, "mycfo");
    }
    
    /**
     * Parser genérico configurable (Excel libre).
     * Requiere mapeo de columnas (fecha, descripcion, monto) y permite opcionales.
     */
    private PreviewDataDTO procesarExcelLibreParaPreview(MultipartFile file, Long organizacionId, String configJson) {
        List<RegistroPreviewDTO> registros = new ArrayList<>();
        List<FilaConErrorDTO> errores = new ArrayList<>();
        int total = 0;

        ExcelLibreConfigDTO config;
        try {
            config = parseExcelLibreConfig(configJson);
        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, e.getMessage()));
            return new PreviewDataDTO(new ArrayList<>(), total, 0, errores, "excel-libre");
        }

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet hoja = workbook.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();

            int startRow = Math.max(0, (config.getDataStartRow() != null ? config.getDataStartRow() - 1 : 1));
            Map<String, Integer> idx = config.getColumnMap();

            for (int i = startRow; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                if (fila == null) continue;

                try {
                    String rawFecha = getCellValue(fila, idx.get("fecha"), fmt);
                    String rawDesc = getCellValue(fila, idx.get("descripcion"), fmt);
                    String rawMonto = getCellValue(fila, idx.get("monto"), fmt);

                    if (rawFecha.isEmpty() && rawDesc.isEmpty() && rawMonto.isEmpty()) {
                        continue;
                    }
                    total++;

                    if (rawFecha.isEmpty() || rawDesc.isEmpty() || rawMonto.isEmpty()) {
                        throw new RuntimeException("Faltan datos obligatorios (fecha, descripción o monto).");
                    }

                    LocalDate fecha = parseFechaGenerica(fila.getCell(idx.get("fecha")), rawFecha, config.getDateFormat());
                    Double monto = parseMontoGenerico(rawMonto, config.getDecimalSeparator());
                    TipoMovimiento tipo = determinarTipoMovimiento(monto);

                    String categoria = getCellValue(fila, idx.get("categoria"), fmt);
                    String monedaStr = getCellValue(fila, idx.get("moneda"), fmt);
                    String medioPagoStr = getCellValue(fila, idx.get("mediopago"), fmt);
                    String origenStr = getCellValue(fila, idx.get("origen"), fmt);

                    TipoMoneda moneda = parseMoneda(monedaStr);
                    TipoMedioPago medioPago = parseMedioPago(medioPagoStr);

                    RegistroPreviewDTO preview = new RegistroPreviewDTO(
                            i + 1,
                            tipo,
                            monto,
                            fecha,
                            rawDesc,
                            origenStr == null || origenStr.isEmpty() ? "EXCEL_LIBRE" : origenStr,
                            medioPago,
                            moneda
                    );

                    if (categoria != null && !categoria.isEmpty()) {
                        preview.setCategoriaSugerida(categoria);
                    } else {
                        preview.setCategoriaSugerida(categorySuggestionService.sugerirCategoria(rawDesc, tipo));
                    }

                    verificarDuplicado(preview, registros);
                    registros.add(preview);

                } catch (Exception ex) {
                    errores.add(new FilaConErrorDTO(i + 1, ex.getMessage()));
                }
            }

        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo: " + e.getMessage()));
        }

        List<RegistroPreviewDTO> registrosConDuplicados = duplicateDetectionService.detectarDuplicadosEnBD(registros, organizacionId);
        return new PreviewDataDTO(registrosConDuplicados, total, registrosConDuplicados.size(), errores, "excel-libre");
    }
    
    private PreviewDataDTO procesarMercadoPagoParaPreview(MultipartFile file, Long organizacionId) {
        List<RegistroPreviewDTO> registros = new ArrayList<>();
        List<FilaConErrorDTO> errores = new ArrayList<>();
        int total = 0;
        
        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet hoja = workbook.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();
            
            Row header = hoja.getRow(HEADER_ROW_INDEX);
            if (header == null) {
                errores.add(new FilaConErrorDTO(0, "No existe la fila de encabezados en el índice " + HEADER_ROW_INDEX));
                return new PreviewDataDTO(registros, total, 0, errores, "mercado-pago");
            }
            
            Map<String, Integer> idx = new HashMap<>();
            for (int c = 0; c < header.getLastCellNum(); c++) {
                String v = fmt.formatCellValue(header.getCell(c)).trim().toUpperCase(Locale.ROOT);
                if (v.equals("RELEASE_DATE")) idx.put("FECHA", c);
                else if (v.equals("TRANSACTION_TYPE")) idx.put("TIPO", c);
                else if (v.equals("TRANSACTION_NET_AMOUNT")) idx.put("MONTO", c);
            }
            
            if (idx.size() < 3) {
                errores.add(new FilaConErrorDTO(0,
                        "Faltan columnas esperadas (RELEASE_DATE, TRANSACTION_TYPE, TRANSACTION_NET_AMOUNT)."));
                return new PreviewDataDTO(registros, total, 0, errores, "mercado-pago");
            }
            
            for (int i = HEADER_ROW_INDEX + 1; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                if (fila == null) continue;
                
                try {
                    String rawFecha = fmt.formatCellValue(fila.getCell(idx.get("FECHA"))).trim();
                    String rawTipo = fmt.formatCellValue(fila.getCell(idx.get("TIPO"))).trim();
                    String rawMonto = fmt.formatCellValue(fila.getCell(idx.get("MONTO"))).trim();
                    
                    if (rawFecha.isEmpty() && rawTipo.isEmpty() && rawMonto.isEmpty()) continue;
                    
                    total++;
                    
                    if (rawFecha.isEmpty() || rawMonto.isEmpty()) {
                        throw new RuntimeException("Faltan datos obligatorios (RELEASE_DATE o TRANSACTION_NET_AMOUNT).");
                    }
                    
                    LocalDate fechaLocal = parseFechaMercadoPago(fila.getCell(idx.get("FECHA")));
                    Double montoValor = parseMontoEsAr(rawMonto);
                    TipoMovimiento tipoMov = determinarTipoMovimiento(montoValor);
                    
                    RegistroPreviewDTO preview = new RegistroPreviewDTO(
                            i + 1, tipoMov, montoValor, fechaLocal,
                            rawTipo, "MERCADO_PAGO", parseMedioPago("Mercado Pago"), TipoMoneda.ARS
                    );
                    
                    // Sugerir categoría usando el tipo de registro para mejor precisión
                    preview.setCategoriaSugerida(categorySuggestionService.sugerirCategoria(rawTipo, tipoMov));
                    
                    // Verificar duplicados
                    verificarDuplicado(preview, registros);
                    
                    registros.add(preview);
                    
                } catch (Exception ex) {
                    errores.add(new FilaConErrorDTO(i + 1, ex.getMessage()));
                }
            }
            
        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo: " + e.getMessage()));
        }
        
        // Detectar duplicados en la base de datos
        List<RegistroPreviewDTO> registrosConDuplicados = duplicateDetectionService.detectarDuplicadosEnBD(registros, organizacionId);
        
        return new PreviewDataDTO(registrosConDuplicados, total, registrosConDuplicados.size(), errores, "mercado-pago");
    }
    
    private PreviewDataDTO procesarSantanderParaPreview(MultipartFile file, Long organizacionId) {
        List<RegistroPreviewDTO> registros = new ArrayList<>();
        List<FilaConErrorDTO> errores = new ArrayList<>();
        int total = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet hoja = workbook.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();

            int headerIdx = buscarFilaEncabezadosSantander(hoja, fmt);
            if (headerIdx == -1) {
                errores.add(new FilaConErrorDTO(0, "No se encontraron encabezados (Fecha, Descripción, Referencia, Caja de Ahorro)"));
                return new PreviewDataDTO(registros, total, 0, errores, "santander");
            }

            for (int i = headerIdx + 1; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                if (fila == null) continue;

                try {
                    String fechaStr = fmt.formatCellValue(fila.getCell(1)).trim();
                    String descripcion = fmt.formatCellValue(fila.getCell(3)).trim();
                    String refStr = fmt.formatCellValue(fila.getCell(4)).trim();
                    String cajaStr = fmt.formatCellValue(fila.getCell(5)).trim();
                    String ctaCteStr = fmt.formatCellValue(fila.getCell(6)).trim();

                    if (fechaStr.isEmpty() || descripcion.isEmpty()) {
                        continue;
                    }
                    if (descripcion.toLowerCase(Locale.ROOT).contains("saldo")) {
                        break;
                    }

                    double monto = elegirMontoSantander(cajaStr, ctaCteStr);
                    if (monto == 0) continue;
                    total++;

                    LocalDate fecha = parseFechaSantander(fechaStr);
                    TipoMovimiento tipoMov = determinarTipoMovimiento(monto);
                    RegistroPreviewDTO preview = new RegistroPreviewDTO(
                            i + 1,
                            tipoMov,
                            monto,
                            fecha,
                            descripcion,
                            "SANTANDER",
                            parseMedioPago("Transferencia"),
                            TipoMoneda.ARS
                    );
                    preview.setCategoriaSugerida(categorySuggestionService.sugerirCategoria(descripcion, tipoMov));
                    preview.setMotivoDuplicado(refStr);
                    verificarDuplicado(preview, registros);
                    registros.add(preview);

                } catch (Exception ex) {
                    errores.add(new FilaConErrorDTO(i + 1, ex.getMessage()));
                }
            }

        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo: " + e.getMessage()));
        }

        List<RegistroPreviewDTO> registrosConDuplicados = duplicateDetectionService.detectarDuplicadosEnBD(registros, organizacionId);
        if (!registrosConDuplicados.isEmpty()) {
            StringBuilder dbg = new StringBuilder();
            registrosConDuplicados.forEach(m -> dbg.append(String.format(
                    "\n  fila=%d fecha=%s monto=%s desc=\"%s\"",
                    m.getFilaExcel(), m.getFechaEmision(), m.getMontoTotal(), m.getDescripcion()
            )));
            log.info("[Santander] Preview detectados {} movimientos, registros={}, errores={} {}", total, registrosConDuplicados.size(), errores.size(), dbg);
        } else {
            log.info("[Santander] Preview detectados {} movimientos, registros={}, errores={}", total, registrosConDuplicados.size(), errores.size());
        }
        return new PreviewDataDTO(registrosConDuplicados, total, registrosConDuplicados.size(), errores, "santander");
    }
    
    private void verificarDuplicado(RegistroPreviewDTO nuevoRegistro, List<RegistroPreviewDTO> registrosExistentes) {
        for (RegistroPreviewDTO existente : registrosExistentes) {
            if (sonRegistrosIguales(nuevoRegistro, existente)) {
                nuevoRegistro.setEsDuplicado(true);
                nuevoRegistro.setMotivoDuplicado("Registro duplicado encontrado en fila " + existente.getFilaExcel());
                break;
            }
        }
    }
    
    private boolean sonRegistrosIguales(RegistroPreviewDTO reg1, RegistroPreviewDTO reg2) {
        return Objects.equals(reg1.getFechaEmision(), reg2.getFechaEmision()) &&
               Objects.equals(reg1.getMontoTotal(), reg2.getMontoTotal()) &&
               Objects.equals(reg1.getDescripcion(), reg2.getDescripcion()) &&
               Objects.equals(reg1.getOrigen(), reg2.getOrigen());
    }
    
    /**
     * Determina el tipo de registro basado en el monto
     * @param monto Monto del movimiento
     * @return TipoRegistro.Ingreso si es positivo, TipoRegistro.Egreso si es negativo
     */
    private TipoMovimiento determinarTipoMovimiento(Double monto) {
        if (monto == null) return TipoMovimiento.Ingreso;
        return monto >= 0 ? TipoMovimiento.Ingreso : TipoMovimiento.Egreso;
    }

    private TipoMovimiento parseTipoMovimiento(String rawTipo, Double monto) {
        if (rawTipo != null && !rawTipo.isBlank()) {
            try {
                return TipoMovimiento.valueOf(rawTipo.trim());
            } catch (Exception ignore) {
                // fallback a inferencia
            }
        }
        return determinarTipoMovimiento(monto);
    }

    private TipoMoneda parseMoneda(String rawMoneda) {
        if (rawMoneda == null || rawMoneda.isBlank()) {
            return TipoMoneda.ARS;
        }
        String normalized = rawMoneda.trim().toUpperCase(Locale.ROOT);
        try {
            return TipoMoneda.valueOf(normalized);
        } catch (Exception e) {
            return TipoMoneda.ARS;
        }
    }

    private ExcelLibreConfigDTO parseExcelLibreConfig(String json) {
        if (json == null || json.isBlank()) {
            throw new IllegalArgumentException("Se requiere el mapeo de columnas (config) para excel-libre.");
        }
        try {
            ExcelLibreConfigDTO config = objectMapper.readValue(json, ExcelLibreConfigDTO.class);
            if (config.getColumnMap() == null ||
                !config.getColumnMap().containsKey("fecha") ||
                !config.getColumnMap().containsKey("descripcion") ||
                !config.getColumnMap().containsKey("monto")) {
                throw new IllegalArgumentException("El mapeo debe incluir columnas para fecha, descripcion y monto.");
            }
            return config;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Config de excel-libre invalida: " + e.getMessage());
        }
    }

    private String getCellValue(Row fila, Integer colIdx, DataFormatter fmt) {
        if (fila == null || colIdx == null) return "";
        Cell cell = fila.getCell(colIdx);
        return cell == null ? "" : fmt.formatCellValue(cell).trim();
    }

    private LocalDate parseFechaGenerica(Cell cell, String raw, String formato) {
        if (cell != null && cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getLocalDateTimeCellValue().toLocalDate();
        }
        if (raw == null || raw.isBlank()) {
            throw new RuntimeException("Fecha vacia.");
        }
        List<String> patrones = new ArrayList<>();
        if (formato != null && !formato.isBlank()) {
            patrones.add(formato);
        }
        patrones.addAll(Arrays.asList("dd/MM/uuuu", "dd-MM-uuuu", "uuuu-MM-dd", "MM/dd/uuuu"));
        for (String p : patrones) {
            try {
                return LocalDate.parse(raw.trim(), DateTimeFormatter.ofPattern(p));
            } catch (Exception ignore) {}
        }
        throw new RuntimeException("Formato de fecha invalido: " + raw);
    }

    private Double parseMontoGenerico(String rawMonto, String decimalSeparator) {
        if (rawMonto == null || rawMonto.isBlank()) {
            throw new RuntimeException("Monto vacio.");
        }
        String normalized = cleanDecimal(rawMonto, decimalSeparator);
        try {
            return Double.parseDouble(normalized);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Monto invalido: " + rawMonto);
        }
    }

    private String cleanDecimal(String raw, String decimalSeparator) {
        String s = raw.replace("$", "").replaceAll("\\s+", "");
        if (decimalSeparator != null && decimalSeparator.equals(",")) {
            s = s.replace(".", "");
            s = s.replace(",", ".");
        } else if (s.contains(",") && !s.contains(".")) {
            s = s.replace(",", ".");
        } else {
            s = s.replace(",", "");
        }
        return s;
    }
    
    /**
     * Normaliza el monto de un movimiento según su tipo:
     * - Egresos siempre negativos
     * - Ingresos siempre positivos
     */
    private void normalizarMontoMovimiento(Movimiento movimiento) {
        if (movimiento.getMontoTotal() == null || movimiento.getTipo() == null) {
            return;
        }
        
        double monto = movimiento.getMontoTotal();
        
        if (movimiento.getTipo() == TipoMovimiento.Egreso) {
            // Egreso siempre negativo
            if (monto > 0) {
                movimiento.setMontoTotal(-monto);
            }
        } else if (movimiento.getTipo() == TipoMovimiento.Ingreso) {
            // Ingreso siempre positivo
            if (monto < 0) {
                movimiento.setMontoTotal(-monto);
            }
        }
    }

    private ResumenCargaDTO procesarGalicia(MultipartFile file, String usuarioSub, Long organizacionId) {
        int total = 0;
        int correctos = 0;
        List<FilaConErrorDTO> errores = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet hoja = workbook.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();

            int headerIdx = buscarFilaEncabezadosGalicia(hoja, fmt);
            if (headerIdx == -1) {
                errores.add(new FilaConErrorDTO(0, "No se encontraron encabezados (Fecha, Movimiento, Debito/Credito)"));
                return new ResumenCargaDTO(total, correctos, errores);
            }

            Map<String, Integer> idx = mapearColumnasGalicia(hoja.getRow(headerIdx), fmt);

            for (int i = headerIdx + 1; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                if (fila == null) continue;

                try {
                    String rawFecha = fmt.formatCellValue(fila.getCell(idx.get("FECHA"))).trim();
                    String rawMov = fmt.formatCellValue(fila.getCell(idx.get("MOVIMIENTO"))).trim();
                    String rawDeb = fmt.formatCellValue(fila.getCell(idx.get("DEBITO"))).trim();
                    String rawCred = fmt.formatCellValue(fila.getCell(idx.get("CREDITO"))).trim();

                    if (rawFecha.isEmpty() && rawMov.isEmpty() && rawDeb.isEmpty() && rawCred.isEmpty()) {
                        continue;
                    }
                    total++;

                    if (rawFecha.isEmpty()) {
                        throw new RuntimeException("Falta la fecha.");
                    }

                    LocalDate fechaLocal = parseFechaGalicia(fila.getCell(idx.get("FECHA")));
                    double debitoVal = parseMontoGalicia(rawDeb);
                    double creditoVal = parseMontoGalicia(rawCred);

                    if (debitoVal == 0 && creditoVal == 0) {
                        throw new RuntimeException("Debe existir debito o credito distinto de cero.");
                    }

                    double monto = calcularMontoGalicia(debitoVal, creditoVal);

                    Movimiento mov = new Movimiento();
                    mov.setTipo(determinarTipoMovimiento(monto));
                    mov.setMontoTotal(monto);
                    // Hora no viene en el extracto: usar inicio del día
                    mov.setFechaEmision(fechaLocal.atStartOfDay());
                    mov.setDescripcion(rawMov);
                    mov.setMedioPago(parseMedioPago("Transferencia"));
                    mov.setMoneda(TipoMoneda.ARS);
                    mov.setOrigenNombre("GALICIA");
                    enriquecerConContexto(mov, usuarioSub, organizacionId);

                    normalizarMontoMovimiento(mov);

                    movimientoRepo.save(mov);
                    correctos++;
                    notifications.publishMovement(mov, usuarioSub, 1L);

                } catch (Exception ex) {
                    errores.add(new FilaConErrorDTO(i + 1, ex.getMessage()));
                }
            }

        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo: " + e.getMessage()));
        }

        return new ResumenCargaDTO(total, correctos, errores);
    }
    private ResumenCargaDTO procesarNacion(MultipartFile file, String usuarioSub, Long organizacionId) {
        int total = 0;
        int correctos = 0;
        List<FilaConErrorDTO> errores = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet hoja = workbook.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();

            int headerIdx = buscarFilaEncabezadosNacion(hoja, fmt);
            if (headerIdx == -1) {
                errores.add(new FilaConErrorDTO(0, "No se encontraron encabezados (Fecha, Descripcion, Debito/Credito)"));
                return new ResumenCargaDTO(total, correctos, errores);
            }

            for (int i = headerIdx + 1; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                if (fila == null) continue;

                try {
                    String fechaStr = fmt.formatCellValue(fila.getCell(0)).trim();
                    String horaStr = fmt.formatCellValue(fila.getCell(1)).trim();
                    String descripcion = fmt.formatCellValue(fila.getCell(2)).trim();
                    String debStr = fmt.formatCellValue(fila.getCell(5)).trim();
                    String credStr = fmt.formatCellValue(fila.getCell(6)).trim();

                    if (fechaStr.isEmpty() || descripcion.isEmpty()) {
                        continue;
                    }
                    if (descripcion.toLowerCase(Locale.ROOT).contains("saldo final")) break;

                    double debito = parseMontoFlexible(debStr);
                    double credito = parseMontoFlexible(credStr);
                    if (debito == 0 && credito == 0) {
                        continue;
                    }

                    total++;
                    double monto = credito - Math.abs(debito);
                    LocalDateTime fechaHora = buildFechaHoraNacion(fechaStr, horaStr);

                    Movimiento mov = new Movimiento();
                    mov.setTipo(determinarTipoMovimiento(monto));
                    mov.setMontoTotal(monto);
                    mov.setFechaEmision(fechaHora);
                    mov.setDescripcion(descripcion);
                    mov.setMedioPago(parseMedioPago("Transferencia"));
                    mov.setMoneda(TipoMoneda.ARS);
                    mov.setOrigenNombre("NACION");
                    enriquecerConContexto(mov, usuarioSub, organizacionId);

                    normalizarMontoMovimiento(mov);
                    movimientoRepo.save(mov);
                    correctos++;
                    notifications.publishMovement(mov, usuarioSub, 1L);

                } catch (Exception ex) {
                    errores.add(new FilaConErrorDTO(i + 1, ex.getMessage()));
                }
            }

        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo: " + e.getMessage()));
        }

        return new ResumenCargaDTO(total, correctos, errores);
    }

    private PreviewDataDTO procesarGaliciaParaPreview(MultipartFile file, Long organizacionId) {
        List<RegistroPreviewDTO> registros = new ArrayList<>();
        List<FilaConErrorDTO> errores = new ArrayList<>();
        int total = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet hoja = workbook.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();

            int headerIdx = buscarFilaEncabezadosGalicia(hoja, fmt);
            if (headerIdx == -1) {
                errores.add(new FilaConErrorDTO(0, "No se encontraron encabezados (Fecha, Movimiento, Debito/Credito)"));
                return new PreviewDataDTO(registros, total, 0, errores, "galicia");
            }

            Map<String, Integer> idx = mapearColumnasGalicia(hoja.getRow(headerIdx), fmt);

            for (int i = headerIdx + 1; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                if (fila == null) continue;

                try {
                    String rawFecha = fmt.formatCellValue(fila.getCell(idx.get("FECHA"))).trim();
                    String rawMov = fmt.formatCellValue(fila.getCell(idx.get("MOVIMIENTO"))).trim();
                    String rawDeb = fmt.formatCellValue(fila.getCell(idx.get("DEBITO"))).trim();
                    String rawCred = fmt.formatCellValue(fila.getCell(idx.get("CREDITO"))).trim();

                    if (rawFecha.isEmpty() && rawMov.isEmpty() && rawDeb.isEmpty() && rawCred.isEmpty()) {
                        continue;
                    }
                    total++;

                    if (rawFecha.isEmpty()) {
                        throw new RuntimeException("Falta la fecha.");
                    }

                    LocalDate fechaLocal = parseFechaGalicia(fila.getCell(idx.get("FECHA")));
                    double debitoVal = parseMontoGalicia(rawDeb);
                    double creditoVal = parseMontoGalicia(rawCred);

                    if (debitoVal == 0 && creditoVal == 0) {
                        throw new RuntimeException("Debe existir debito o credito distinto de cero.");
                    }

                    double monto = calcularMontoGalicia(debitoVal, creditoVal);
                    TipoMovimiento tipoMov = determinarTipoMovimiento(monto);

                    RegistroPreviewDTO preview = new RegistroPreviewDTO(
                            i + 1,
                            tipoMov,
                            monto,
                            fechaLocal,
                            rawMov,
                            "GALICIA",
                            parseMedioPago("Transferencia"),
                            TipoMoneda.ARS
                    );

                    preview.setCategoriaSugerida(categorySuggestionService.sugerirCategoria(rawMov, tipoMov));
                    verificarDuplicado(preview, registros);
                    registros.add(preview);

                } catch (Exception ex) {
                    errores.add(new FilaConErrorDTO(i + 1, ex.getMessage()));
                }
            }

        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo: " + e.getMessage()));
        }

        List<RegistroPreviewDTO> registrosConDuplicados = duplicateDetectionService.detectarDuplicadosEnBD(registros, organizacionId);
        return new PreviewDataDTO(registrosConDuplicados, total, registrosConDuplicados.size(), errores, "galicia");
    }

    private int buscarFilaEncabezadosGalicia(Sheet hoja, DataFormatter fmt) {
        for (int r = 0; r <= hoja.getLastRowNum(); r++) {
            Row fila = hoja.getRow(r);
            if (fila == null) continue;
            Map<String, Integer> idx = mapearColumnasGalicia(fila, fmt);
            if (idx.containsKey("FECHA") && idx.containsKey("MOVIMIENTO")
                    && (idx.containsKey("DEBITO") || idx.containsKey("CREDITO"))) {
                return r;
            }
        }
        return -1;
    }

    private Map<String, Integer> mapearColumnasGalicia(Row header, DataFormatter fmt) {
        Map<String, Integer> idx = new HashMap<>();
        for (int c = 0; c < header.getLastCellNum(); c++) {
            String raw = fmt.formatCellValue(header.getCell(c)).trim();
            if (raw.isEmpty()) continue;
            String normalized = Normalizer.normalize(raw, Normalizer.Form.NFD)
                    .replaceAll("\\p{M}", "")
                    .toUpperCase(Locale.ROOT);
            if (normalized.contains("FECHA")) idx.put("FECHA", c);
            else if (normalized.contains("MOVIMIENTO")) idx.put("MOVIMIENTO", c);
            else if (normalized.contains("DEBIT")) idx.put("DEBITO", c);
            else if (normalized.contains("CREDITO")) idx.put("CREDITO", c);
            else if (normalized.contains("SALDO")) idx.putIfAbsent("SALDO", c);
        }
        return idx;
    }

    private LocalDate parseFechaGalicia(Cell cFecha) {
        if (cFecha == null) throw new RuntimeException("Fecha vacia.");
        if (cFecha.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cFecha)) {
            return cFecha.getLocalDateTimeCellValue().toLocalDate();
        }
        String raw = new DataFormatter().formatCellValue(cFecha).trim();
        DateTimeFormatter f1 = DateTimeFormatter.ofPattern("dd/MM/uuuu");
        DateTimeFormatter f2 = DateTimeFormatter.ofPattern("dd-MM-uuuu");
        try { return LocalDate.parse(raw, f1); } catch (Exception ignore) {}
        try { return LocalDate.parse(raw, f2); } catch (Exception ignore) {}
        throw new RuntimeException("Formato de fecha invalido: " + raw);
    }

    private double parseMontoGalicia(String raw) {
        if (raw == null || raw.isBlank()) return 0d;
        String cleaned = raw.replace(".", "").replace(",", ".").replace("$", "").replaceAll("\\s+", "");
        try {
            return Double.parseDouble(cleaned);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Monto invalido: " + raw);
        }
    }

    private double parseMontoArNullable(String raw) {
        if (raw == null || raw.isBlank()) return 0d;
        String cleaned = raw.replace(".", "").replace(",", ".").replace("$", "").replaceAll("\\s+", "");
        try {
            return Double.parseDouble(cleaned);
        } catch (NumberFormatException e) {
            return 0d;
        }
    }

    private double parseMontoFlexible(String raw) {
        if (raw == null || raw.isBlank()) return 0d;
        String s = raw.replace("$", "").replaceAll("\\s+", "");
        if (s.contains(",")) {
            s = s.replace(".", "");
            s = s.replace(",", ".");
        }
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Monto invalido: " + raw);
        }
    }

    private double parseMontoSantander(String raw) {
        if (raw == null || raw.isBlank()) return 0d;
        String s = raw.replace("$", "").replaceAll("\\s+", "");
        // Normalizar: si viene con coma decimal, quitar puntos de miles
        if (s.contains(",")) {
            s = s.replace(".", "");
            s = s.replace(",", ".");
        }
        // Caso raro: dos puntos (33.150.00) -> dejar solo el último como decimal
        int firstDot = s.indexOf('.');
        int lastDot = s.lastIndexOf('.');
        if (firstDot != -1 && lastDot != -1 && firstDot != lastDot) {
            String sinPrimero = s.substring(0, lastDot).replace(".", "") + s.substring(lastDot);
            s = sinPrimero;
        }
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Monto invalido: " + raw);
        }
    }

    private String normalizeTexto(String raw) {
        if (raw == null) return "";
        return Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("\u00A0", " ")
                .trim();
    }

    private LocalDate parseFechaSantander(String rawFecha) {
        String limpio = rawFecha.replaceAll("\\s+", " ").trim();
        DateTimeFormatter f1 = DateTimeFormatter.ofPattern("dd/MM/uuuu");
        DateTimeFormatter f2 = DateTimeFormatter.ofPattern("dd-MM-uuuu");
        try { return LocalDate.parse(limpio, f1); } catch (Exception ignore) {}
        try { return LocalDate.parse(limpio, f2); } catch (Exception ignore) {}
        throw new RuntimeException("Fecha invalida: " + rawFecha);
    }

    private int buscarFilaEncabezadosNacion(Sheet hoja, DataFormatter fmt) {
        for (int r = 0; r <= hoja.getLastRowNum(); r++) {
            Row fila = hoja.getRow(r);
            if (fila == null) continue;
            String c0 = fmt.formatCellValue(fila.getCell(0)).trim().toLowerCase(Locale.ROOT);
            String c2 = fmt.formatCellValue(fila.getCell(2)).trim().toLowerCase(Locale.ROOT);
            if (c0.contains("fecha") && c2.contains("descripcion")) {
                return r;
            }
        }
        return -1;
    }
    private int buscarFilaEncabezadosSantander(Sheet hoja, DataFormatter fmt) {
        for (int r = 0; r <= hoja.getLastRowNum(); r++) {
            Row fila = hoja.getRow(r);
            if (fila == null) continue;
            List<String> valores = new ArrayList<>();
            for (int c = 0; c < fila.getLastCellNum(); c++) {
                String v = normalizeTexto(fmt.formatCellValue(fila.getCell(c))).toLowerCase(Locale.ROOT);
                if (!v.isEmpty()) valores.add(v);
            }
            if (valores.isEmpty()) continue;
            boolean tieneFecha = valores.stream().anyMatch(v -> v.contains("fecha"));
            boolean tieneDesc = valores.stream().anyMatch(v -> v.contains("descripcion"));
            boolean tieneCaja = valores.stream().anyMatch(v -> v.contains("caja de ahorro"));
            if (tieneFecha && tieneDesc && tieneCaja) {
                return r;
            }
        }
        return -1;
    }

    private LocalDateTime buildFechaHora(String fechaStr, String horaStr) {
        LocalDate fecha = parseFechaUala(fechaStr); // dd MMM uuuu o dd/MM/yyyy en Uala/Nacion
        try {
            if (horaStr != null && !horaStr.isBlank()) {
                java.time.LocalTime t = java.time.LocalTime.parse(horaStr.trim());
                return LocalDateTime.of(fecha, t);
            }
        } catch (Exception ignore) {}
        return fecha.atStartOfDay();
    }

    private LocalDateTime buildFechaHoraNacion(String fechaStr, String horaStr) {
        LocalDate fecha = parseFechaNacion(fechaStr);
        try {
            if (horaStr != null && !horaStr.isBlank()) {
                java.time.LocalTime t = java.time.LocalTime.parse(horaStr.trim());
                return LocalDateTime.of(fecha, t);
            }
        } catch (Exception ignore) {}
        return fecha.atStartOfDay();
    }

    private double elegirMontoSantander(String cajaStr, String ctaCteStr) {
        double caja = parseMontoSantander(cajaStr);
        double ctaCte = parseMontoSantander(ctaCteStr);
        return caja != 0 ? caja : ctaCte;
    }

    private double calcularMontoGalicia(double debito, double credito) {
        if (credito != 0 && debito != 0) {
            return credito - Math.abs(debito);
        }
        if (credito != 0) {
            return credito;
        }
        return -Math.abs(debito);
    }

    private LocalDate parseFechaNacion(String rawFecha) {
        String limpio = rawFecha.replaceAll("\\s+", " ").trim();
        DateTimeFormatter f1 = DateTimeFormatter.ofPattern("dd/MM/uuuu");
        DateTimeFormatter f2 = DateTimeFormatter.ofPattern("dd/MM/uu");
        try { return LocalDate.parse(limpio, f1); } catch (Exception ignore) {}
        try { return LocalDate.parse(limpio, f2); } catch (Exception ignore) {}
        throw new RuntimeException("Fecha invalida: " + rawFecha);
    }

    private ResumenCargaDTO procesarUala(MultipartFile file, String usuarioSub, Long organizacionId) {
        int total = 0;
        int correctos = 0;
        List<FilaConErrorDTO> errores = new ArrayList<>();

        try (InputStream is = file.getInputStream()) {
            List<UalaMovimiento> movimientos = extraerMovimientosUala(is);
            total = movimientos.size();
            log.info("[Uala] Preview/import detectados {} movimientos (usuarioSub={}, org={})", total, usuarioSub, organizacionId);

            for (int i = 0; i < movimientos.size(); i++) {
                UalaMovimiento movPdf = movimientos.get(i);
                try {
                    Movimiento mov = new Movimiento();
                    mov.setTipo(determinarTipoMovimiento(movPdf.monto()));
                    mov.setMontoTotal(movPdf.monto());
                    mov.setFechaEmision(movPdf.fecha().atStartOfDay());
                    mov.setDescripcion(movPdf.descripcion());
                    mov.setMedioPago(parseMedioPago("Transferencia"));
                    mov.setMoneda(TipoMoneda.ARS);
                    mov.setOrigenNombre("UALA");
                    enriquecerConContexto(mov, usuarioSub, organizacionId);

                    normalizarMontoMovimiento(mov);
                    movimientoRepo.save(mov);
                    correctos++;
                    notifications.publishMovement(mov, usuarioSub, 1L);

                } catch (Exception ex) {
                    errores.add(new FilaConErrorDTO(movPdf.lineaOriginal(), ex.getMessage()));
                }
            }
        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo PDF: " + e.getMessage()));
        }

        return new ResumenCargaDTO(total, correctos, errores);
    }

    private PreviewDataDTO procesarUalaParaPreview(MultipartFile file, Long organizacionId) {
        List<RegistroPreviewDTO> registros = new ArrayList<>();
        List<FilaConErrorDTO> errores = new ArrayList<>();
        int total = 0;

        try (InputStream is = file.getInputStream()) {
            List<UalaMovimiento> movimientos = extraerMovimientosUala(is);
            total = movimientos.size();
            log.info("[Uala] Preview detectados {} movimientos (org={})", total, organizacionId);
            if (!movimientos.isEmpty()) {
                StringBuilder dbg = new StringBuilder();
                movimientos.forEach(m -> dbg.append(String.format(
                        "\n  linea=%d fecha=%s monto=%s desc=\"%s\"",
                        m.lineaOriginal(), m.fecha(), m.monto(), m.descripcion()
                )));
                log.info("[Uala] Preview movimientos detallados:{}", dbg);
            }

            for (int i = 0; i < movimientos.size(); i++) {
                UalaMovimiento movPdf = movimientos.get(i);
                try {
                    TipoMovimiento tipoMov = determinarTipoMovimiento(movPdf.monto());
                    RegistroPreviewDTO preview = new RegistroPreviewDTO(
                            movPdf.lineaOriginal(),
                            tipoMov,
                            movPdf.monto(),
                            movPdf.fecha(),
                            movPdf.descripcion(),
                            "UALA",
                            parseMedioPago("Transferencia"),
                            TipoMoneda.ARS
                    );
                    preview.setCategoriaSugerida(categorySuggestionService.sugerirCategoria(movPdf.descripcion(), tipoMov));
                    verificarDuplicado(preview, registros);
                    registros.add(preview);
                } catch (Exception ex) {
                    errores.add(new FilaConErrorDTO(movPdf.lineaOriginal(), ex.getMessage()));
                }
            }
        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo PDF: " + e.getMessage()));
        }

        List<RegistroPreviewDTO> registrosConDuplicados = duplicateDetectionService.detectarDuplicadosEnBD(registros, organizacionId);
        return new PreviewDataDTO(registrosConDuplicados, total, registrosConDuplicados.size(), errores, "uala");
    }
    private PreviewDataDTO procesarNacionParaPreview(MultipartFile file, Long organizacionId) {
        List<RegistroPreviewDTO> registros = new ArrayList<>();
        List<FilaConErrorDTO> errores = new ArrayList<>();
        int total = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet hoja = workbook.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();

            int headerIdx = buscarFilaEncabezadosNacion(hoja, fmt);
            if (headerIdx == -1) {
                errores.add(new FilaConErrorDTO(0, "No se encontraron encabezados (Fecha, Descripcion, Debito/Credito)"));
                return new PreviewDataDTO(registros, total, 0, errores, "nacion");
            }

            for (int i = headerIdx + 1; i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                if (fila == null) continue;

                try {
                    String fechaStr = fmt.formatCellValue(fila.getCell(0)).trim();
                    String horaStr = fmt.formatCellValue(fila.getCell(1)).trim();
                    String descripcion = fmt.formatCellValue(fila.getCell(2)).trim();
                    String debStr = fmt.formatCellValue(fila.getCell(5)).trim();
                    String credStr = fmt.formatCellValue(fila.getCell(6)).trim();

                    if (fechaStr.isEmpty() || descripcion.isEmpty()) {
                        continue;
                    }
                    if (descripcion.toLowerCase(Locale.ROOT).contains("saldo final")) break;

                    double debito = parseMontoFlexible(debStr);
                    double credito = parseMontoFlexible(credStr);
                    if (debito == 0 && credito == 0) {
                        continue;
                    }

                    total++;
                    double monto = credito - Math.abs(debito);
                    LocalDateTime fechaHora = buildFechaHoraNacion(fechaStr, horaStr);
                    TipoMovimiento tipoMov = determinarTipoMovimiento(monto);

                    RegistroPreviewDTO preview = new RegistroPreviewDTO(
                            i + 1,
                            tipoMov,
                            monto,
                            fechaHora.toLocalDate(),
                            descripcion,
                            "NACION",
                            parseMedioPago("Transferencia"),
                            TipoMoneda.ARS
                    );
                    preview.setCategoriaSugerida(categorySuggestionService.sugerirCategoria(descripcion, tipoMov));
                    verificarDuplicado(preview, registros);
                    registros.add(preview);

                } catch (Exception ex) {
                    errores.add(new FilaConErrorDTO(i + 1, ex.getMessage()));
                }
            }

        } catch (Exception e) {
            errores.add(new FilaConErrorDTO(0, "Error al leer el archivo: " + e.getMessage()));
        }

        List<RegistroPreviewDTO> registrosConDuplicados = duplicateDetectionService.detectarDuplicadosEnBD(registros, organizacionId);
        return new PreviewDataDTO(registrosConDuplicados, total, registrosConDuplicados.size(), errores, "nacion");
    }

    private List<UalaMovimiento> extraerMovimientosUala(InputStream is) throws Exception {
        try (PDDocument doc = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            stripper.setLineSeparator("\n");
            String texto = stripper.getText(doc);
            return parsearLineasUala(texto);
        }
    }

    private List<UalaMovimiento> parsearLineasUala(String texto) {
        List<UalaMovimiento> lista = new ArrayList<>();

        String plano = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("\u00A0", " ")
                .replace("\r", "");

        String[] lines = plano.split("\\n");
        Pattern filaLinea = Pattern.compile("^(\\d{1,2}\\s+\\w{3}\\s+\\d{4})\\s+(.*)$");
        Pattern montoPat = Pattern.compile("-?\\$?\\s?[\\d\\.]+,\\d{2}");

        int idx = 0;
        for (String rawLine : lines) {
            idx++;
            String line = rawLine.replace("\u00A0", " ").trim();
            if (line.isEmpty()) continue;
            Matcher m = filaLinea.matcher(line);
            if (!m.find()) continue;

            String fechaStr = m.group(1);
            String resto = m.group(2).trim();
            List<String> montos = new ArrayList<>();
            Matcher mMontos = montoPat.matcher(resto);
            while (mMontos.find()) {
                montos.add(mMontos.group());
            }
            if (montos.isEmpty()) continue;
            String montoStr = montos.size() >= 2 ? montos.get(montos.size() - 2) : montos.get(0);
            int idxMonto = resto.lastIndexOf(montoStr);
            String descripcion = idxMonto > 0 ? resto.substring(0, idxMonto).trim() : resto;
            if (descripcion.equalsIgnoreCase("saldo inicial")) continue;

            LocalDate fecha = parseFechaUala(fechaStr);
            double monto = parseMontoEsAr(montoStr);

            lista.add(new UalaMovimiento(fecha, descripcion, monto, idx));
        }

        if (!lista.isEmpty()) {
            StringBuilder dbg = new StringBuilder();
            for (UalaMovimiento m : lista) {
                dbg.append(String.format(
                        "\n  linea=%d fecha=%s monto=%s desc=\"%s\"",
                        m.lineaOriginal(), m.fecha(), m.monto(), m.descripcion()
                ));
            }
            log.info("[Uala] parsearLineasUala detectó {} filas útiles:{}", lista.size(), dbg);
        } else {
            log.info("[Uala] parsearLineasUala no detectó filas útiles");
            StringBuilder dbg = new StringBuilder();
            for (int i = 0; i < Math.min(lines.length, 120); i++) {
                dbg.append("\n").append(String.format("%03d: %s", i + 1, lines[i]));
            }
            log.info("[Uala] Primeras líneas extraídas por PDFBox:{}", dbg);
        }
        return lista;
    }

    private int lineIndex(String line, String[] rawLines) {
        for (int i = 0; i < rawLines.length; i++) {
            if (rawLines[i] != null && rawLines[i].trim().equals(line)) {
                return i + 1; // numerar desde 1
            }
        }
        return 0;
    }

    private LocalDate parseFechaUala(String rawFecha) {
        String limpio = rawFecha.replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d MMM uuuu", new Locale("es", "ES"));
        try {
            return LocalDate.parse(limpio, formatter);
        } catch (Exception e) {
            throw new RuntimeException("Fecha invalida: " + rawFecha);
        }
    }

    private record UalaMovimiento(LocalDate fecha, String descripcion, double monto, int lineaOriginal) {}
}
