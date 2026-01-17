package registro.movimientosexcel.services;

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

    public ResumenCargaDTO procesarArchivo(MultipartFile file, String tipoOrigen, String usuarioSub) {
        Long organizacionId = obtenerOrganizacionId(usuarioSub);
        switch (tipoOrigen.toLowerCase()) {
            case "mycfo": return procesarGenerico(file, usuarioSub, organizacionId);
            case "mercado-pago": return procesarMercadoPago(file, usuarioSub, organizacionId);
            case "galicia": return procesarGalicia(file, usuarioSub, organizacionId);
            case "uala": return procesarUala(file, usuarioSub, organizacionId);
            case "santander": return procesarSantander(file, usuarioSub, organizacionId);
            default: throw new IllegalArgumentException("Tipo de origen no soportado: " + tipoOrigen);
        }
    }
    
    public PreviewDataDTO procesarArchivoParaPreview(MultipartFile file, String tipoOrigen, String usuarioSub) {
        Long organizacionId = obtenerOrganizacionId(usuarioSub);
        switch (tipoOrigen.toLowerCase()) {
            case "mycfo": return procesarGenericoParaPreview(file, organizacionId);
            case "mercado-pago": return procesarMercadoPagoParaPreview(file, organizacionId);
            case "galicia": return procesarGaliciaParaPreview(file, organizacionId);
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
                    notifications.publishMovement(movimiento, 1L);
                    
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
                    notifications.publishMovement(mov, 1L);

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

    private ResumenCargaDTO procesarSantander(MultipartFile file, String usuarioSub, Long organizacionId) {
        // TODO: lógica específica para Santander
        return new ResumenCargaDTO(0, 0, new ArrayList<>());
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
        // TODO: implementar lógica específica para Santander
        return new PreviewDataDTO(new ArrayList<>(), 0, 0, new ArrayList<>(), "santander");
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
                    notifications.publishMovement(mov, 1L);

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

    private double calcularMontoGalicia(double debito, double credito) {
        if (credito != 0 && debito != 0) {
            return credito - Math.abs(debito);
        }
        if (credito != 0) {
            return credito;
        }
        return -Math.abs(debito);
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
                    notifications.publishMovement(mov, 1L);

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

    private List<UalaMovimiento> extraerMovimientosUala(InputStream is) throws Exception {
        try (PDDocument doc = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
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
        boolean enTabla = false;
        Pattern filaLinea = Pattern.compile("^(\\d{1,2}\\s+\\w{3}\\s+\\d{4})\\s+(.*)$");
        Pattern montoPat = Pattern.compile("-?\\$?\\s?[\\d\\.]+,\\d{2}");

        int idx = 0;
        for (String rawLine : lines) {
            idx++;
            String normalized = Normalizer.normalize(rawLine, Normalizer.Form.NFD)
                    .replaceAll("\\p{M}", "")
                    .toLowerCase(Locale.ROOT);
            if (!enTabla) {
                if (normalized.contains("movimientos del mes")) {
                    enTabla = true;
                }
                continue;
            }
            if (normalized.startsWith("informacion util")) {
                break;
            }

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

        log.info("[Uala] parsearLineasUala detectó {} filas útiles", lista.size());
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
