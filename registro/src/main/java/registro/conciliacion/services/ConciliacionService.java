package registro.conciliacion.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import registro.cargarDatos.models.*;
import registro.cargarDatos.repositories.FacturaRepository;
import registro.cargarDatos.repositories.MovimientoRepository;
import registro.cargarDatos.repositories.PagareRepository;
import registro.cargarDatos.repositories.ReciboRepository;
import registro.conciliacion.dtos.DocumentoSugeridoDTO;
import registro.conciliacion.dtos.MovimientoDTO;

import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConciliacionService {

    private final MovimientoRepository movimientoRepository;
    private final FacturaRepository facturaRepository;
    private final PagareRepository pagareRepository;
    private final ReciboRepository reciboRepository;

    /**
     * Obtiene movimientos sin conciliar con paginación
     */
    @Transactional(readOnly = true)
    public Page<MovimientoDTO> obtenerMovimientosSinConciliar(Pageable pageable, Long empresaId, TipoMoneda moneda) {
        Page<Movimiento> registros = moneda != null
                ? movimientoRepository.findByOrganizacionIdAndDocumentoComercialIsNullAndMoneda(empresaId, moneda, pageable)
                : movimientoRepository.findByOrganizacionIdAndDocumentoComercialIsNull(empresaId, pageable);
        
        return registros.map(this::convertirAMovimientoDTO);
    }

    /**
     * Obtiene todos los movimientos (conciliados y sin conciliar) con paginación
     */
    @Transactional(readOnly = true)
    public Page<MovimientoDTO> obtenerTodosLosMovimientos(Pageable pageable, Long empresaId, TipoMoneda moneda) {
        Page<Movimiento> registros = moneda != null
                ? movimientoRepository.findByOrganizacionIdAndMoneda(empresaId, moneda, pageable)
                : movimientoRepository.findByOrganizacionId(empresaId, pageable);
        
        return registros.map(this::convertirAMovimientoDTO);
    }

    /**
     * Obtiene todos los movimientos sin conciliar (sin paginación) - para compatibilidad
     */
    @Transactional(readOnly = true)
    public List<MovimientoDTO> obtenerMovimientosSinConciliarPorMoneda(Long empresaId, TipoMoneda moneda) {
        List<Movimiento> registros = moneda != null
                ? movimientoRepository.findByOrganizacionIdAndDocumentoComercialIsNullAndMoneda(empresaId, moneda)
                : movimientoRepository.findByOrganizacionIdAndDocumentoComercialIsNull(empresaId);
        
        return registros.stream()
                .map(this::convertirAMovimientoDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todos los movimientos (conciliados y sin conciliar) - para compatibilidad
     */
    @Transactional(readOnly = true)
    public List<MovimientoDTO> obtenerTodosLosMovimientosPorMoneda(Long empresaId, TipoMoneda moneda) {
        List<Movimiento> registros = moneda != null
                ? movimientoRepository.findByOrganizacionIdAndMoneda(empresaId, moneda)
                : movimientoRepository.findByOrganizacionId(empresaId);
        
        return registros.stream()
                .map(this::convertirAMovimientoDTO)
                .collect(Collectors.toList());
    }

    /**
     * Sugiere documentos para un movimiento específico usando algoritmo de matching optimizado
     * PASO 1: Filtra documentos por tipo Y (monto O fecha O descripción)
     * PASO 2: Aplica reglas de scoring solo sobre documentos filtrados
     */
    @Transactional(readOnly = true)
    public List<DocumentoSugeridoDTO> sugerirDocumentos(Long movimientoId, Long empresaId, TipoMoneda monedaFiltro) {
        Movimiento movimiento = movimientoRepository.findById(movimientoId)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));

        if (!movimiento.getOrganizacionId().equals(empresaId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Movimiento no pertenece a la empresa");
        }

        TipoMoneda monedaMovimiento = movimiento.getMoneda() != null ? movimiento.getMoneda() : monedaFiltro;

        System.out.println("\n========== INICIANDO BÚSQUEDA DE SUGERENCIAS ==========");
        System.out.println("Movimiento ID: " + movimientoId);
        System.out.println("Tipo: " + movimiento.getTipo());
        System.out.println("Monto: " + movimiento.getMontoTotal());
        System.out.println("Fecha: " + movimiento.getFechaEmision());
        System.out.println("Origen: " + movimiento.getOrigenNombre());
        System.out.println("Destino: " + movimiento.getDestinoNombre());
        System.out.println("Descripción: " + movimiento.getDescripcion());

        List<DocumentoSugeridoDTO> sugerencias = new ArrayList<>();
        
        // PASO 1: Filtrar documentos candidatos por tipo Y (monto O fecha O descripción)
        List<DocumentoComercial> candidatos = filtrarDocumentosCandidatos(movimiento, empresaId, monedaMovimiento);
        
        System.out.println("\n--- CANDIDATOS ENCONTRADOS: " + candidatos.size() + " ---");
        
        // PASO 2: Aplicar algoritmo de scoring solo sobre candidatos filtrados
        for (DocumentoComercial documento : candidatos) {
            int score = calcularScore(movimiento, documento);
            
            System.out.println("\nCandidato: " + documento.getTipoDocumento() + " #" + documento.getNumeroDocumento());
            System.out.println("  Monto: " + documento.getMontoTotal());
            System.out.println("  Fecha: " + documento.getFechaEmision());
            System.out.println("  Score: " + score);
            
            if (score >= 30) { // Solo sugerir si hay al menos 30% de coincidencia
                DocumentoSugeridoDTO sugerencia = crearSugerenciaDesdeDocumento(documento, score);
                sugerencias.add(sugerencia);
                System.out.println("  ✓ AGREGADO A SUGERENCIAS");
            } else {
                System.out.println("  ✗ DESCARTADO (score < 30)");
            }
        }

        // Ordenar por score descendente
        sugerencias.sort(Comparator.comparingInt(DocumentoSugeridoDTO::getScoreCoincidencia).reversed());

        System.out.println("\n--- SUGERENCIAS FINALES: " + sugerencias.size() + " ---");
        for (DocumentoSugeridoDTO sug : sugerencias) {
            System.out.println("  " + sug.getTipoDocumento() + " #" + sug.getNumeroDocumento() + " - Score: " + sug.getScoreCoincidencia());
        }
        System.out.println("========== FIN BÚSQUEDA ==========\n");

        // Limitar a top 10 sugerencias
        return sugerencias.stream().limit(10).collect(Collectors.toList());
    }
    
    /**
     * Filtra documentos candidatos que coincidan en tipo Y (monto O fecha O descripción O todos)
     * Esto reduce significativamente el espacio de búsqueda antes de aplicar scoring
     * Carga EAGER de todos los datos para evitar lazy loading
     */
    private List<DocumentoComercial> filtrarDocumentosCandidatos(Movimiento movimiento, Long empresaId, TipoMoneda monedaMovimiento) {
        List<DocumentoComercial> candidatos = new ArrayList<>();
        
        // Determinar el tipo de movimiento (INGRESO/EGRESO)
        TipoMovimiento tipoMovimiento = movimiento.getTipo();
        
        // Obtener todos los documentos de la base de datos
        // findAll() carga todos los registros de forma eager
        List<Factura> facturas = monedaMovimiento != null
                ? facturaRepository.findByOrganizacionIdAndMoneda(empresaId, monedaMovimiento)
                : facturaRepository.findByOrganizacionId(empresaId);
        // Salvaguarda: si por alguna razón el repository no devuelve por moneda, filtrar manualmente
        if (monedaMovimiento != null && (facturas == null || facturas.isEmpty())) {
            facturas = facturaRepository.findByOrganizacionId(empresaId)
                    .stream()
                    .filter(f -> monedaMovimiento.equals(f.getMoneda()))
                    .collect(Collectors.toList());
        }

        List<Pagare> pagares = monedaMovimiento != null
                ? pagareRepository.findByOrganizacionIdAndMoneda(empresaId, monedaMovimiento)
                : pagareRepository.findByOrganizacionId(empresaId);
        if (monedaMovimiento != null && (pagares == null || pagares.isEmpty())) {
            pagares = pagareRepository.findByOrganizacionId(empresaId)
                    .stream()
                    .filter(p -> monedaMovimiento.equals(p.getMoneda()))
                    .collect(Collectors.toList());
        }

        List<Recibo> recibos = monedaMovimiento != null
                ? reciboRepository.findByOrganizacionIdAndMoneda(empresaId, monedaMovimiento)
                : reciboRepository.findByOrganizacionId(empresaId);
        if (monedaMovimiento != null && (recibos == null || recibos.isEmpty())) {
            recibos = reciboRepository.findByOrganizacionId(empresaId)
                    .stream()
                    .filter(r -> monedaMovimiento.equals(r.getMoneda()))
                    .collect(Collectors.toList());
        }
        
        System.out.println("\n--- INICIANDO FILTRADO DE CANDIDATOS ---");
        System.out.println("Total facturas en BD: " + (facturas != null ? facturas.size() : 0));
        System.out.println("Total pagarés en BD: " + (pagares != null ? pagares.size() : 0));
        System.out.println("Total recibos en BD: " + (recibos != null ? recibos.size() : 0));
        
        // Forzar la inicialización de las colecciones para evitar lazy loading
        // Esto asegura que todos los datos estén disponibles
        if (facturas != null) {
            facturas.size(); // Fuerza la carga completa
        }
        if (pagares != null) {
            pagares.size(); // Fuerza la carga completa
        }
        if (recibos != null) {
            recibos.size(); // Fuerza la carga completa
        }
        
        int facturasAnalizadas = 0;
        int facturasAprobadas = 0;
        
        // Filtrar facturas - recorrer TODAS las facturas sin excepción
        if (facturas != null && !facturas.isEmpty()) {
            System.out.println("\n--- ANALIZANDO FACTURAS ---");
            for (Factura factura : facturas) {
                try {
                    facturasAnalizadas++;
                    // Forzar acceso a propiedades para asegurar carga completa
                    factura.getMontoTotal();
                    factura.getFechaEmision();
                    factura.getCategoria();
                    // Asegurar que coincida la moneda cuando viene filtrada
                    if (monedaMovimiento != null && !monedaMovimiento.equals(factura.getMoneda())) {
                        continue;
                    }
                    
                    boolean cumple = cumpleCriteriosFiltrado(movimiento, factura, tipoMovimiento);
                    
                    System.out.println("Factura #" + factura.getNumeroDocumento() + 
                                     " | Monto: " + factura.getMontoTotal() + 
                                     " | Fecha: " + factura.getFechaEmision() + 
                                     " | Cumple: " + (cumple ? "SÍ" : "NO"));
                    
                    if (cumple) {
                        candidatos.add(factura);
                        facturasAprobadas++;
                    }
                } catch (Exception e) {
                    // Si hay error en alguna factura, continuar con la siguiente
                    System.err.println("Error procesando factura ID: " + factura.getIdDocumento() + " - " + e.getMessage());
                    e.printStackTrace();
                }
            }
            System.out.println("Facturas analizadas: " + facturasAnalizadas + " | Aprobadas: " + facturasAprobadas);
        }
        
        // Filtrar pagarés - recorrer TODOS los pagarés
        if (pagares != null && !pagares.isEmpty()) {
            for (Pagare pagare : pagares) {
                try {
                    // Forzar acceso a propiedades
                    pagare.getMontoTotal();
                    pagare.getFechaEmision();
                    pagare.getCategoria();
                    if (monedaMovimiento != null && !monedaMovimiento.equals(pagare.getMoneda())) {
                        continue;
                    }
                    
                    if (cumpleCriteriosFiltrado(movimiento, pagare, tipoMovimiento)) {
                        candidatos.add(pagare);
                    }
                } catch (Exception e) {
                    System.err.println("Error procesando pagaré ID: " + pagare.getIdDocumento() + " - " + e.getMessage());
                }
            }
        }
        
        // Filtrar recibos - recorrer TODOS los recibos
        if (recibos != null && !recibos.isEmpty()) {
            for (Recibo recibo : recibos) {
                try {
                    // Forzar acceso a propiedades
                    recibo.getMontoTotal();
                    recibo.getFechaEmision();
                    recibo.getCategoria();
                    if (monedaMovimiento != null && !monedaMovimiento.equals(recibo.getMoneda())) {
                        continue;
                    }
                    
                    if (cumpleCriteriosFiltrado(movimiento, recibo, tipoMovimiento)) {
                        candidatos.add(recibo);
                    }
                } catch (Exception e) {
                    System.err.println("Error procesando recibo ID: " + recibo.getIdDocumento() + " - " + e.getMessage());
                }
            }
        }
        
        return candidatos;
    }
    
    /**
     * Verifica si un documento cumple los criterios de filtrado:
     * - Mismo tipo (INGRESO/EGRESO)
     * - Y al menos uno de: monto similar O fecha cercana O descripción relacionada
     */
    private boolean cumpleCriteriosFiltrado(Movimiento movimiento, DocumentoComercial documento, TipoMovimiento tipoMovimiento) {
        // Criterio 1: Verificar tipo de movimiento
        boolean tipoCoincide = verificarTipoCoincide(documento, tipoMovimiento);
        if (!tipoCoincide) {
            return false; // Si el tipo no coincide, descartar inmediatamente
        }
        
        // Criterio 2: Al menos uno de estos debe cumplirse
        boolean montoSimilar = verificarMontoSimilar(movimiento, documento);
        boolean fechaCercana = verificarFechaCercana(movimiento, documento);
        boolean descripcionRelacionada = verificarDescripcionRelacionada(movimiento, documento);
        
        // Retornar true si cumple tipo Y (monto O fecha O descripción)
        return montoSimilar || fechaCercana || descripcionRelacionada;
    }
    
    /**
     * Verifica si el tipo de documento coincide con el tipo de movimiento
     */
    private boolean verificarTipoCoincide(DocumentoComercial documento, TipoMovimiento tipoMovimiento) {
        // Para facturas: EGRESO si somos compradores, INGRESO si somos vendedores
        if (documento instanceof Factura) {
            Factura factura = (Factura) documento;
            // Simplificación: considerar todas las facturas (ajustar según lógica de negocio)
            return true;
        }
        
        // Para pagarés y recibos: considerar todos (ajustar según lógica de negocio)
        return true;
    }
    
    /**
     * Verifica si el monto es similar (dentro del 15% de diferencia en valor absoluto)
     */
    private boolean verificarMontoSimilar(Movimiento movimiento, DocumentoComercial documento) {
        if (movimiento.getMontoTotal() == null || documento.getMontoTotal() == null) {
            return false;
        }
        
        double montoMov = Math.abs(movimiento.getMontoTotal());
        double montoDoc = Math.abs(documento.getMontoTotal());
        
        if (montoDoc == 0) {
            return false;
        }
        
        double diferenciaPorcentual = Math.abs(montoMov - montoDoc) / montoDoc;
        
        // Considerar similar si la diferencia es menor al 15%
        return diferenciaPorcentual <= 0.15;
    }
    
    /**
     * Verifica si la fecha es cercana (dentro de 30 días)
     */
    private boolean verificarFechaCercana(Movimiento movimiento, DocumentoComercial documento) {
        if (movimiento.getFechaEmision() == null || documento.getFechaEmision() == null) {
            return false;
        }
        
        long diferenciaDias = Math.abs(ChronoUnit.DAYS.between(
                movimiento.getFechaEmision(), documento.getFechaEmision()));
        
        // Considerar cercana si está dentro de 30 días
        return diferenciaDias <= 30;
    }
    
    /**
     * Verifica si hay relación en la descripción/nombres
     */
    private boolean verificarDescripcionRelacionada(Movimiento movimiento, DocumentoComercial documento) {
        String origenNombre = movimiento.getOrigenNombre() != null ? movimiento.getOrigenNombre().toLowerCase() : "";
        String destinoNombre = movimiento.getDestinoNombre() != null ? movimiento.getDestinoNombre().toLowerCase() : "";
        String descripcion = movimiento.getDescripcion() != null ? movimiento.getDescripcion().toLowerCase() : "";
        
        List<String> nombresDocumento = obtenerNombresDelDocumento(documento);
        
        for (String nombre : nombresDocumento) {
            if (nombre == null || nombre.trim().isEmpty()) {
                continue;
            }
            
            String nombreLower = nombre.toLowerCase();
            
            // Verificar si hay alguna coincidencia de texto
            if (origenNombre.contains(nombreLower) || nombreLower.contains(origenNombre) ||
                destinoNombre.contains(nombreLower) || nombreLower.contains(destinoNombre) ||
                descripcion.contains(nombreLower) || nombreLower.contains(descripcion)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Crea una sugerencia desde cualquier tipo de documento
     */
    private DocumentoSugeridoDTO crearSugerenciaDesdeDocumento(DocumentoComercial documento, int score) {
        if (documento instanceof Factura) {
            return crearSugerenciaDesdeFactura((Factura) documento, score);
        } else if (documento instanceof Pagare) {
            return crearSugerenciaDesdePagare((Pagare) documento, score);
        } else if (documento instanceof Recibo) {
            return crearSugerenciaDesdeRecibo((Recibo) documento, score);
        }
        return null;
    }
    
    /**
     * Vincula un movimiento con un documento
     */
    @Transactional
    public MovimientoDTO vincularMovimientoConDocumento(Long movimientoId, Long documentoId, Long empresaId) {
        Movimiento movimiento = movimientoRepository.findById(movimientoId)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));

        if (!movimiento.getOrganizacionId().equals(empresaId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Movimiento no pertenece a la empresa");
        }

        // Buscar el documento en todas las tablas
        DocumentoComercial documento = buscarDocumento(documentoId, empresaId);
        
        if (documento == null) {
            throw new RuntimeException("Documento no encontrado");
        }

        if (!empresaId.equals(documento.getOrganizacionId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Documento no pertenece a la empresa");
        }

        movimiento.setDocumentoComercial(documento);
        Movimiento guardado = movimientoRepository.save(movimiento);
        
        // Actualizar estado de pago si el documento es una Factura
        if (documento instanceof Factura) {
            actualizarEstadoPagoFactura((Factura) documento, empresaId);
        }

        return convertirAMovimientoDTO(guardado);
    }

    /**
     * Desvincula un movimiento de su documento
     */
    @Transactional
    public MovimientoDTO desvincularMovimiento(Long movimientoId, Long empresaId) {
        Movimiento movimiento = movimientoRepository.findById(movimientoId)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));

        if (!movimiento.getOrganizacionId().equals(empresaId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Movimiento no pertenece a la empresa");
        }

        DocumentoComercial documento = movimiento.getDocumentoComercial();
        movimiento.setDocumentoComercial(null);
        Movimiento guardado = movimientoRepository.save(movimiento);
        
        // Actualizar estado de pago si el documento era una Factura
        if (documento instanceof Factura) {
            actualizarEstadoPagoFactura((Factura) documento, empresaId);
        }

        return convertirAMovimientoDTO(guardado);
    }

    /**
     * Algoritmo de scoring para calcular coincidencia entre movimiento y documento
     * Distribución de puntos: Monto (50), Fecha (30), Texto (15), Categoría (5)
     */
    private int calcularScore(Movimiento movimiento, DocumentoComercial documento) {
        int score = 0;

        // 1. Coincidencia de monto (50 puntos) - PRIORIDAD MÁXIMA
        if (movimiento.getMontoTotal() != null && documento.getMontoTotal() != null) {
            score += calcularScoreMonto(movimiento.getMontoTotal(), documento.getMontoTotal());
        }

        // 2. Coincidencia de fecha (30 puntos)
        if (movimiento.getFechaEmision() != null && documento.getFechaEmision() != null) {
            score += calcularScoreFecha(movimiento.getFechaEmision(), documento.getFechaEmision());
        }

        // 3. Coincidencia de origen/destino con nombres en el documento (15 puntos)
        int similitudTexto = calcularSimilitudTexto(movimiento, documento);
        score += similitudTexto;

        // 4. Coincidencia de categoría (5 puntos)
        if (movimiento.getCategoria() != null && documento.getCategoria() != null) {
            if (movimiento.getCategoria().equalsIgnoreCase(documento.getCategoria())) {
                score += 5;
            }
        }

        return score;
    }

    /**
     * Calcula el score de coincidencia de monto con alta precisión
     * Usa epsilon para comparación de doubles y múltiples niveles de tolerancia
     */
    private int calcularScoreMonto(Double montoMovimiento, Double montoDocumento) {
        // Trabajar siempre con valores absolutos
        double montoMov = Math.abs(montoMovimiento);
        double montoDoc = Math.abs(montoDocumento);
        
        // Epsilon para comparación de doubles (considera errores de punto flotante)
        final double EPSILON = 0.001; // 0.1 centavo de tolerancia
        
        // Calcular diferencia absoluta
        double diferencia = Math.abs(montoMov - montoDoc);
        
        // 1. Coincidencia exacta o casi exacta (diferencia menor a 1 centavo)
        if (diferencia < EPSILON) {
            return 50; // Máxima puntuación
        }
        
        // 2. Diferencia absoluta muy pequeña (menos de 1 peso/dólar)
        if (diferencia < 1.0) {
            return 48; // Casi perfecto
        }
        
        // 3. Para diferencias mayores, usar porcentaje
        // Evitar división por cero
        if (montoDoc < EPSILON) {
            return 0;
        }
        
        double diferenciaPorcentual = diferencia / montoDoc;
        
        // Escala de scoring basada en porcentaje de diferencia
        if (diferenciaPorcentual <= 0.001) { // 0.1%
            return 47;
        } else if (diferenciaPorcentual <= 0.005) { // 0.5%
            return 45;
        } else if (diferenciaPorcentual <= 0.01) { // 1%
            return 40;
        } else if (diferenciaPorcentual <= 0.02) { // 2%
            return 32;
        } else if (diferenciaPorcentual <= 0.03) { // 3%
            return 28;
        } else if (diferenciaPorcentual <= 0.05) { // 5%
            return 22;
        } else if (diferenciaPorcentual <= 0.08) { // 8%
            return 15;
        } else if (diferenciaPorcentual <= 0.10) { // 10%
            return 10;
        } else if (diferenciaPorcentual <= 0.15) { // 15%
            return 5;
        }
        
        return 0; // Diferencia demasiado grande
    }

    /**
     * Calcula el score de coincidencia de fecha considerando días hábiles y fin de semana
     */
    private int calcularScoreFecha(java.time.LocalDateTime fechaMovimiento, java.time.LocalDateTime fechaDocumento) {
        // Convertir a LocalDate para comparación
        java.time.LocalDate fechaMov = fechaMovimiento.toLocalDate();
        java.time.LocalDate fechaDoc = fechaDocumento.toLocalDate();
        
        // Calcular diferencia en días calendario
        long diferenciaDias = Math.abs(ChronoUnit.DAYS.between(fechaMov, fechaDoc));
        
        // 1. Mismo día - coincidencia perfecta
        if (diferenciaDias == 0) {
            return 30;
        }
        
        // 2. Calcular días hábiles de diferencia (más preciso para transacciones bancarias)
        int diasHabiles = contarDiasHabiles(fechaMov, fechaDoc);
        
        // Priorizar días hábiles sobre días calendario
        // Si la diferencia es solo por fin de semana, dar más puntos
        if (diferenciaDias <= 3 && diasHabiles <= 1) {
            return 28; // Ej: viernes vs lunes
        }
        
        // 3. Escala basada en días calendario
        if (diferenciaDias == 1) {
            return 28; // Un día de diferencia
        } else if (diferenciaDias == 2) {
            return 26;
        } else if (diferenciaDias == 3) {
            return 23;
        } else if (diferenciaDias <= 5) {
            return 20;
        } else if (diferenciaDias <= 7) {
            return 16;
        } else if (diferenciaDias <= 10) {
            return 12;
        } else if (diferenciaDias <= 15) {
            return 8;
        } else if (diferenciaDias <= 20) {
            return 5;
        } else if (diferenciaDias <= 30) {
            return 3;
        }
        
        return 0; // Más de 30 días de diferencia
    }

    /**
     * Cuenta los días hábiles entre dos fechas (excluyendo sábados y domingos)
     */
    private int contarDiasHabiles(java.time.LocalDate inicio, java.time.LocalDate fin) {
        java.time.LocalDate fechaInicio = inicio.isBefore(fin) ? inicio : fin;
        java.time.LocalDate fechaFin = inicio.isBefore(fin) ? fin : inicio;
        
        int diasHabiles = 0;
        java.time.LocalDate fecha = fechaInicio;
        
        while (!fecha.isAfter(fechaFin)) {
            java.time.DayOfWeek diaSemana = fecha.getDayOfWeek();
            // Contar solo de lunes a viernes
            if (diaSemana != java.time.DayOfWeek.SATURDAY && diaSemana != java.time.DayOfWeek.SUNDAY) {
                diasHabiles++;
            }
            fecha = fecha.plusDays(1);
        }
        
        return Math.abs(diasHabiles);
    }

    /**
     * Calcula similitud de texto entre movimiento y documento
     */
    private int calcularSimilitudTexto(Movimiento movimiento, DocumentoComercial documento) {
        int score = 0;

        String origenNombre = movimiento.getOrigenNombre() != null ? movimiento.getOrigenNombre().toLowerCase() : "";
        String destinoNombre = movimiento.getDestinoNombre() != null ? movimiento.getDestinoNombre().toLowerCase() : "";
        String descripcion = movimiento.getDescripcion() != null ? movimiento.getDescripcion().toLowerCase() : "";

        List<String> nombresDocumento = obtenerNombresDelDocumento(documento);

        for (String nombre : nombresDocumento) {
            String nombreLower = nombre.toLowerCase();
            
            // Verificar si el nombre está contenido en origen, destino o descripción
            if (origenNombre.contains(nombreLower) || nombreLower.contains(origenNombre)) {
                score += 7;
            }
            if (destinoNombre.contains(nombreLower) || nombreLower.contains(destinoNombre)) {
                score += 7;
            }
            if (descripcion.contains(nombreLower) || nombreLower.contains(descripcion)) {
                score += 6;
            }
        }

        return Math.min(score, 15); // Máximo 15 puntos
    }

    /**
     * Obtiene los nombres relacionados de un documento (vendedor, comprador, etc.)
     */
    private List<String> obtenerNombresDelDocumento(DocumentoComercial documento) {
        List<String> nombres = new ArrayList<>();

        if (documento instanceof Factura) {
            Factura factura = (Factura) documento;
            if (factura.getVendedorNombre() != null) nombres.add(factura.getVendedorNombre());
            if (factura.getCompradorNombre() != null) nombres.add(factura.getCompradorNombre());
        } else if (documento instanceof Pagare) {
            Pagare pagare = (Pagare) documento;
            if (pagare.getBeneficiarioNombre() != null) nombres.add(pagare.getBeneficiarioNombre());
            if (pagare.getDeudorNombre() != null) nombres.add(pagare.getDeudorNombre());
        } else if (documento instanceof Recibo) {
            Recibo recibo = (Recibo) documento;
            if (recibo.getReceptorNombre() != null) nombres.add(recibo.getReceptorNombre());
            if (recibo.getEmisorNombre() != null) nombres.add(recibo.getEmisorNombre());
        }

        return nombres;
    }

    /**
     * Busca un documento por ID en todas las tablas
     */
    private DocumentoComercial buscarDocumento(Long documentoId, Long empresaId) {
        // Intentar buscar en facturas
        return facturaRepository.findById(documentoId)
                .filter(f -> empresaId.equals(f.getOrganizacionId()))
                .<DocumentoComercial>map(f -> f)
                .orElseGet(() ->
                        pagareRepository.findById(documentoId)
                                .filter(p -> empresaId.equals(p.getOrganizacionId()))
                                .<DocumentoComercial>map(p -> p)
                                .orElseGet(() ->
                                        reciboRepository.findById(documentoId)
                                                .filter(r -> empresaId.equals(r.getOrganizacionId()))
                                                .<DocumentoComercial>map(r -> r)
                                                .orElse(null)
                                )
                );
    }

    /**
     * Convierte un Registro a MovimientoDTO
     */
    private MovimientoDTO convertirAMovimientoDTO(Movimiento registro) {
        MovimientoDTO dto = new MovimientoDTO();
        dto.setId(registro.getId());
        dto.setTipo(registro.getTipo());
        dto.setMontoTotal(registro.getMontoTotal());
        dto.setFechaEmision(registro.getFechaEmision() != null ? registro.getFechaEmision().toLocalDate() : null);
        dto.setCategoria(registro.getCategoria());
        dto.setOrigen(registro.getOrigenNombre()); // Mapeo a origenNombre
        dto.setDestino(registro.getDestinoNombre()); // Mapeo a destinoNombre
        dto.setDescripcion(registro.getDescripcion());
        dto.setMedioPago(registro.getMedioPago());
        dto.setMoneda(registro.getMoneda());

        // Determinar la fuente de origen basado en los datos disponibles
        dto.setFuenteOrigen(determinarFuenteOrigen(registro));

        // Información de conciliación - usar documentoId para evitar lazy loading
        if (registro.getDocumentoId() != null) {
            dto.setConciliado(true);
            dto.setIdDocumentoConciliado(registro.getDocumentoId());
            // Solo cargar detalles del documento si es necesario
            if (registro.getDocumentoComercial() != null) {
                dto.setNumeroDocumentoConciliado(registro.getDocumentoComercial().getNumeroDocumento());
                dto.setTipoDocumentoConciliado(registro.getDocumentoComercial().getTipoDocumento());
            }
        } else {
            dto.setConciliado(false);
        }

        return dto;
    }

    /**
     * Determina la fuente de origen del registro
     */
    private String determinarFuenteOrigen(Movimiento registro) {
        // Si el origen contiene "MercadoPago" o similar
        if (registro.getOrigenNombre() != null && registro.getOrigenNombre().toLowerCase().contains("mercadopago")) {
            return "MERCADOPAGO";
        }
        
        // Si tiene descripción que indica Excel
        if (registro.getDescripcion() != null && registro.getDescripcion().toLowerCase().contains("excel")) {
            return "EXCEL";
        }
        
        // Por defecto, asumimos que es manual
        return "MANUAL";
    }

    /**
     * Crea un DocumentoSugeridoDTO desde una Factura
     */
    private DocumentoSugeridoDTO crearSugerenciaDesdeFactura(Factura factura, int score) {
        DocumentoSugeridoDTO dto = new DocumentoSugeridoDTO();
        dto.setIdDocumento(factura.getIdDocumento());
        dto.setTipoDocumento("FACTURA");
        dto.setNumeroDocumento(factura.getNumeroDocumento());
        dto.setFechaEmision(factura.getFechaEmision() != null ? factura.getFechaEmision().toLocalDate() : null);
        dto.setMontoTotal(factura.getMontoTotal());
        dto.setMoneda(factura.getMoneda());
        dto.setCategoria(factura.getCategoria());
        dto.setNombreRelacionado(factura.getVendedorNombre() != null ? factura.getVendedorNombre() : factura.getCompradorNombre());
        dto.setCuit(factura.getVendedorCuit() != null ? factura.getVendedorCuit() : factura.getCompradorCuit());
        dto.setScoreCoincidencia(score);
        dto.setNivelSugerencia(determinarNivelSugerencia(score));
        dto.setRazonSugerencia(generarRazonSugerencia(score));
        
        return dto;
    }

    /**
     * Crea un DocumentoSugeridoDTO desde un Pagaré
     */
    private DocumentoSugeridoDTO crearSugerenciaDesdePagare(Pagare pagare, int score) {
        DocumentoSugeridoDTO dto = new DocumentoSugeridoDTO();
        dto.setIdDocumento(pagare.getIdDocumento());
        dto.setTipoDocumento("PAGARE");
        dto.setNumeroDocumento(pagare.getNumeroDocumento());
        dto.setFechaEmision(pagare.getFechaEmision() != null ? pagare.getFechaEmision().toLocalDate() : null);
        dto.setMontoTotal(pagare.getMontoTotal());
        dto.setMoneda(pagare.getMoneda());
        dto.setCategoria(pagare.getCategoria());
        dto.setNombreRelacionado(pagare.getBeneficiarioNombre() != null ? pagare.getBeneficiarioNombre() : pagare.getDeudorNombre());
        dto.setCuit(pagare.getBeneficiarioCuit() != null ? pagare.getBeneficiarioCuit() : pagare.getDeudorCuit());
        dto.setScoreCoincidencia(score);
        dto.setNivelSugerencia(determinarNivelSugerencia(score));
        dto.setRazonSugerencia(generarRazonSugerencia(score));
        
        return dto;
    }

    /**
     * Crea un DocumentoSugeridoDTO desde un Recibo
     */
    private DocumentoSugeridoDTO crearSugerenciaDesdeRecibo(Recibo recibo, int score) {
        DocumentoSugeridoDTO dto = new DocumentoSugeridoDTO();
        dto.setIdDocumento(recibo.getIdDocumento());
        dto.setTipoDocumento("RECIBO");
        dto.setNumeroDocumento(recibo.getNumeroDocumento());
        dto.setFechaEmision(recibo.getFechaEmision() != null ? recibo.getFechaEmision().toLocalDate() : null);
        dto.setMontoTotal(recibo.getMontoTotal());
        dto.setMoneda(recibo.getMoneda());
        dto.setCategoria(recibo.getCategoria());
        dto.setNombreRelacionado(recibo.getReceptorNombre() != null ? recibo.getReceptorNombre() : recibo.getEmisorNombre());
        dto.setCuit(recibo.getReceptorCuit() != null ? recibo.getReceptorCuit() : recibo.getEmisorCuit());
        dto.setScoreCoincidencia(score);
        dto.setNivelSugerencia(determinarNivelSugerencia(score));
        dto.setRazonSugerencia(generarRazonSugerencia(score));
        
        return dto;
    }

    /**
     * Determina el nivel de sugerencia basado en el score
     */
    private String determinarNivelSugerencia(int score) {
        if (score >= 70) {
            return "ALTA";
        } else if (score >= 50) {
            return "MEDIA";
        } else {
            return "BAJA";
        }
    }

    /**
     * Genera la razón de la sugerencia basada en el score
     */
    private String generarRazonSugerencia(int score) {
        if (score >= 70) {
            return "Coincidencia alta en fecha, monto y origen/destino";
        } else if (score >= 50) {
            return "Coincidencia media en algunos criterios";
        } else {
            return "Coincidencia baja, verificar manualmente";
        }
    }
    
    /**
     * Actualiza el estado de pago de una factura basado en los movimientos conciliados
     */
    private void actualizarEstadoPagoFactura(Factura factura, Long empresaId) {
        // Obtener todos los movimientos conciliados con esta factura
        List<Movimiento> movimientos = movimientoRepository.findByOrganizacionId(empresaId).stream()
                .filter(r -> r.getDocumentoComercial() != null && 
                            r.getDocumentoComercial().getIdDocumento().equals(factura.getIdDocumento()))
                .collect(Collectors.toList());
        
        if (movimientos.isEmpty()) {
            // Sin movimientos, marcar como NO_PAGADO y PagoPendiente
            factura.setEstadoPago(EstadoPago.NO_PAGADO);
            factura.setEstadoDocumentoComercial(EstadoDocumentoComercial.PagoPendiente);
        } else {
            // Sumar todos los montos de los movimientos
            double totalPagado = movimientos.stream()
                    .mapToDouble(r -> Math.abs(r.getMontoTotal() != null ? r.getMontoTotal() : 0.0))
                    .sum();
            
            double montoFactura = Math.abs(factura.getMontoTotal() != null ? factura.getMontoTotal() : 0.0);
            
            // Comparar con tolerancia del 1% para errores de redondeo
            double diferencia = Math.abs(totalPagado - montoFactura);
            double tolerancia = montoFactura * 0.01;
            
            if (diferencia <= tolerancia || totalPagado >= montoFactura) {
                // Pago completo
                factura.setEstadoPago(EstadoPago.PAGADO);
                factura.setEstadoDocumentoComercial(EstadoDocumentoComercial.Pago);
            } else if (totalPagado > 0) {
                // Pago parcial
                factura.setEstadoPago(EstadoPago.PARCIALMENTE_PAGADO);
                factura.setEstadoDocumentoComercial(EstadoDocumentoComercial.PagoParcialmente);
            } else {
                // Sin pago
                factura.setEstadoPago(EstadoPago.NO_PAGADO);
                factura.setEstadoDocumentoComercial(EstadoDocumentoComercial.PagoPendiente);
            }
        }
        
        facturaRepository.save(factura);
    }
}
