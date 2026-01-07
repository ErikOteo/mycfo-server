package registro.cargarDatos.services;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import registro.cargarDatos.models.EstadoMovimiento;
import registro.cargarDatos.models.Movimiento;
import registro.cargarDatos.models.TipoMovimiento;
import registro.cargarDatos.repositories.MovimientoRepository;
import registro.cargarDatos.services.MovimientoEventService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.Cacheable;

import registro.cargarDatos.dtos.ConciliacionResumenResponse;
import registro.cargarDatos.dtos.ConciliacionTipoResumen;
import registro.cargarDatos.dtos.MontoPorCategoria;
import registro.cargarDatos.dtos.MontosMensualesResponse;
import registro.cargarDatos.dtos.MontosPorCategoriaResponse;
import registro.cargarDatos.dtos.MovimientosPresupuestoResponse;
import registro.cargarDatos.dtos.PuntoMontoMensual;
import registro.cargarDatos.dtos.ResumenMensualResponse;

@Service
@RequiredArgsConstructor
public class MovimientoService {

    private final MovimientoRepository movimientoRepository;
    private final EmpresaDataService empresaDataService;
    private final MovimientoEventService movimientoEventService;
    /**
     * Guarda un nuevo movimiento estableciendo el estado según el tipo
     */
    public Movimiento guardarMovimiento(Movimiento movimiento) {
        movimiento.setFechaCreacion(LocalDateTime.now());
        
        // Normalizar monto según el tipo de movimiento
        normalizarMonto(movimiento);
        
        // Cargar datos de la empresa automáticamente si hay usuarioId
        if (movimiento.getUsuarioId() != null && !movimiento.getUsuarioId().isEmpty()) {
            empresaDataService.cargarDatosEmpresaEnMovimiento(movimiento, movimiento.getUsuarioId());
        }
        
        // Establecer estado automáticamente según el tipo si no está definido
        if (movimiento.getEstado() == null) {
            establecerEstadoPorDefecto(movimiento);
        }
        
        // Guardar el movimiento
        Movimiento savedMovimiento = movimientoRepository.save(movimiento);
        
        // Enviar evento de notificación (asíncrono, no falla si el servicio está caído)
        try {
            movimientoEventService.sendMovementCreatedEvent(savedMovimiento);
        } catch (Exception e) {
            // Log error pero no fallar la operación principal
            System.err.println("Error enviando evento de movimiento: " + e.getMessage());
        }
        
        return savedMovimiento;
    }
    
    /**
     * Normaliza el monto según el tipo de movimiento:
     * - Egreso siempre debe ser negativo
     * - Ingreso siempre debe ser positivo
     */
    private void normalizarMonto(Movimiento movimiento) {
        if (movimiento.getMontoTotal() == null || movimiento.getTipo() == null) {
            return;
        }
        
        double monto = movimiento.getMontoTotal();
        
        if (movimiento.getTipo() == TipoMovimiento.Egreso) {
            // Asegurar que el egreso sea negativo
            if (monto > 0) {
                movimiento.setMontoTotal(-monto);
            }
        } else if (movimiento.getTipo() == TipoMovimiento.Ingreso) {
            // Asegurar que el ingreso sea positivo
            if (monto < 0) {
                movimiento.setMontoTotal(-monto);
            }
        }
    }

    /**
     * Establece el estado por defecto según el tipo de movimiento
     */
    private void establecerEstadoPorDefecto(Movimiento movimiento) {
        if (movimiento.getTipo() == null) {
            movimiento.setEstado(EstadoMovimiento.PENDIENTE);
            return;
        }
        
        switch (movimiento.getTipo()) {
            case Ingreso:
                movimiento.setEstado(EstadoMovimiento.COBRADO);
                break;
            case Egreso:
                movimiento.setEstado(EstadoMovimiento.PAGADO);
                break;
            case Deuda:
            case Acreencia:
                movimiento.setEstado(EstadoMovimiento.PENDIENTE);
                break;
            default:
                movimiento.setEstado(EstadoMovimiento.PENDIENTE);
        }
    }

    /**
     * Lista todos los movimientos
     */
    public List<Movimiento> listarMovimientos() {
        return movimientoRepository.findAll();
    }

    /**
     * Lista movimientos por Organizacion
     */
    public List<Movimiento> listarPorOrganizacion(Long organizacionId) {
        return movimientoRepository.findByOrganizacionId(organizacionId);
    }

    /**
     * Lista movimientos por tipo
     */
    public List<Movimiento> listarPorTipo(TipoMovimiento tipo) {
        return movimientoRepository.findByTipo(tipo);
    }

    /**
     * Lista movimientos por tipo y Organizacion
     */
    public List<Movimiento> listarPorTipoYOrganizacion(TipoMovimiento tipo, Long organizacionId) {
        return movimientoRepository.findByTipoAndOrganizacionId(tipo, organizacionId);
    }

    /**
     * Obtiene un movimiento por ID
     */
    public Movimiento obtenerMovimiento(Long id) {
        return movimientoRepository.findById(id).orElse(null);
    }

    /**
     * Actualiza un movimiento existente
     */
    @Transactional
    public Movimiento actualizarMovimiento(Long id, Movimiento datosActualizados) {
        Optional<Movimiento> optional = movimientoRepository.findById(id);

        if (optional.isEmpty()) {
            throw new RuntimeException("Movimiento no encontrado con id " + id);
        }

        Movimiento movimiento = optional.get();

        // Copiar campos actualizables comunes
        movimiento.setTipo(datosActualizados.getTipo());
        movimiento.setCategoria(datosActualizados.getCategoria());
        movimiento.setMedioPago(datosActualizados.getMedioPago());
        movimiento.setMontoTotal(datosActualizados.getMontoTotal());
        movimiento.setFechaEmision(datosActualizados.getFechaEmision());
        movimiento.setOrigenNombre(datosActualizados.getOrigenNombre());
        movimiento.setOrigenCuit(datosActualizados.getOrigenCuit());
        movimiento.setDestinoNombre(datosActualizados.getDestinoNombre());
        movimiento.setDestinoCuit(datosActualizados.getDestinoCuit());
        movimiento.setDescripcion(datosActualizados.getDescripcion());
        movimiento.setMoneda(datosActualizados.getMoneda());
        movimiento.setEstado(datosActualizados.getEstado());

        // Campos específicos de Deuda/Acreencia
        movimiento.setFechaVencimiento(datosActualizados.getFechaVencimiento());
        movimiento.setMontoPagado(datosActualizados.getMontoPagado());
        movimiento.setCantidadCuotas(datosActualizados.getCantidadCuotas());
        movimiento.setCuotasPagadas(datosActualizados.getCuotasPagadas());
        movimiento.setTasaInteres(datosActualizados.getTasaInteres());
        movimiento.setMontoCuota(datosActualizados.getMontoCuota());
        movimiento.setPeriodicidad(datosActualizados.getPeriodicidad());

        // Normalizar monto según el tipo de movimiento
        normalizarMonto(movimiento);

        movimiento.setFechaActualizacion(LocalDateTime.now());

        return movimientoRepository.save(movimiento);
    }

    /**
     * Elimina un movimiento
     */
    public void eliminarMovimiento(Long id) {
        movimientoRepository.deleteById(id);
    }

    /**
     * Obtiene movimientos con filtros múltiples y paginación
     * OPTIMIZADO: Usa query nativa en BD en lugar de findAll + filtros en memoria
     */
    public Page<Movimiento> obtenerMovimientos(
            Long organizacionId,
            String usuarioId,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            List<TipoMovimiento> tipos,
            Boolean conciliado,
            String nombreRelacionado,
            Pageable pageable
    ) {
        LocalDateTime fechaDesdeTime = fechaDesde != null ? fechaDesde.atStartOfDay() : null;
        LocalDateTime fechaHastaTime = fechaHasta != null ? fechaHasta.plusDays(1).atStartOfDay() : null;
        
        return movimientoRepository.findMovimientosConFiltros(
                organizacionId,
                usuarioId,
                fechaDesdeTime,
                fechaHastaTime,
                tipos,
                conciliado,
                nombreRelacionado,
                pageable
        );
    }

    
    /**
     * Obtiene todos los movimientos sin paginación
     * OPTIMIZADO: Usa query con filtros en BD
     */
    public List<Movimiento> obtenerTodosLosMovimientos(
            Long organizacionId,
            String usuarioId,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            List<TipoMovimiento> tipos,
            Boolean conciliado,
            String nombreRelacionado
    ) {
        LocalDateTime fechaDesdeTime = fechaDesde != null ? fechaDesde.atStartOfDay() : null;
        LocalDateTime fechaHastaTime = fechaHasta != null ? fechaHasta.plusDays(1).atStartOfDay() : null;
        
        // Usar Pageable.unpaged() para obtener todos sin paginación
        Page<Movimiento> page = movimientoRepository.findMovimientosConFiltros(
                organizacionId,
                usuarioId,
                fechaDesdeTime,
                fechaHastaTime,
                tipos,
                conciliado,
                nombreRelacionado,
                Pageable.unpaged()
        );
        
        return page.getContent();
    }
    
    /**
     * Obtiene movimientos agrupados por mes y tipo
     */
    public Map<String, Map<TipoMovimiento, List<Movimiento>>> obtenerMovimientosPorMes(
            Long organizacionId,
            String usuarioId,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            List<TipoMovimiento> tipos,
            Boolean conciliado,
            String nombreRelacionado
    ) {
        // Obtener todos los movimientos filtrados
        List<Movimiento> movimientos = obtenerTodosLosMovimientos(
                organizacionId,
                usuarioId,
                fechaDesde,
                fechaHasta,
                tipos,
                conciliado,
                nombreRelacionado
        );
        
        // Agrupar por mes y tipo
        return movimientos.stream()
                .collect(Collectors.groupingBy(
                        mov -> YearMonth.from(mov.getFechaEmision()).toString(),
                        Collectors.groupingBy(Movimiento::getTipo)
                ));
    }

    public ResumenMensualResponse obtenerResumenMensual(Long organizacionId, String usuarioId, LocalDate fechaReferencia) {
        if (organizacionId == null && (usuarioId == null || usuarioId.isBlank())) {
            throw new IllegalArgumentException("Se requiere Organizacion o usuario para calcular el resumen mensual");
        }

        LocalDate fechaBase = fechaReferencia != null ? fechaReferencia : LocalDate.now();
        YearMonth periodo = YearMonth.from(fechaBase);
        LocalDate inicio = periodo.atDay(1);
        LocalDate fin = periodo.atEndOfMonth();

        QueryResult result = calcularSumas(organizacionId, usuarioId, inicio, fin);
        boolean coincideUsuario = result.totalMovimientos > 0;

        if (!coincideUsuario && organizacionId != null) {
            QueryResult soloOrganizacion = calcularSumas(organizacionId, null, inicio, fin);
            if (soloOrganizacion.totalMovimientos > 0) {
                result = soloOrganizacion;
            }
        }

        return ResumenMensualResponse.builder()
                .organizacionId(organizacionId)
                .usuarioId(usuarioId)
                .coincideUsuario(coincideUsuario)
                .periodo(periodo.toString())
                .periodoInicio(inicio)
                .periodoFin(fin)
                .ingresosTotales(result.ingresos)
                .egresosTotales(result.egresos)
                // Como los egresos ya son negativos, el resultado neto debe ser la suma algebraica
                .resultadoNeto(result.ingresos + result.egresos)
                .totalMovimientos(result.totalMovimientos)
                .build();
    }

        public MontosMensualesResponse obtenerIngresosMensuales(
            Long organizacionId,
            String usuarioId,
            LocalDate fechaReferencia,
            int meses
    ) {
        // Para el dashboard queremos la serie a nivel empresa, no por usuario individual
        // Por eso ignoramos usuarioId y agregamos solo por organizacionId
        return obtenerMontosMensuales(organizacionId, null, fechaReferencia, meses, TipoMovimiento.Ingreso);
    }

    public MontosMensualesResponse obtenerEgresosMensuales(
            Long organizacionId,
            String usuarioId,
            LocalDate fechaReferencia,
            int meses
    ) {
        // Igual que en ingresos, agregamos egresos solo a nivel empresa
        return obtenerMontosMensuales(organizacionId, null, fechaReferencia, meses, TipoMovimiento.Egreso);
    }

    private MontosMensualesResponse obtenerMontosMensuales(
            Long organizacionId,
            String usuarioId,
            LocalDate fechaReferencia,
            int meses,
            TipoMovimiento tipo
    ) {
        // Para las series usadas en el dashboard solo requerimos la organización.
        // usuarioId puede ser null para que el query agregue todos los usuarios de esa empresa.
        if (organizacionId == null) {
            throw new IllegalArgumentException("Organizacion es obligatoria para el resumen mensual por periodo");
        }

        int mesesSeguros = Math.max(1, Math.min(meses, 24));
        LocalDate fechaBase = fechaReferencia != null ? fechaReferencia : LocalDate.now();
        YearMonth periodoBase = YearMonth.from(fechaBase);

        List<PuntoMontoMensual> puntos = new ArrayList<>();
        for (int offset = mesesSeguros - 1; offset >= 0; offset--) {
            YearMonth periodo = periodoBase.minusMonths(offset);
            LocalDate inicio = periodo.atDay(1);
            LocalDate fin = periodo.atEndOfMonth();

            Double total = movimientoRepository.sumMontoByOrganizacionOrUsuarioAndTipoAndFechaBetween(
                    organizacionId,
                    usuarioId,
                    tipo,
                    inicio.atStartOfDay(),
                    fin.plusDays(1).atStartOfDay()
            );

            puntos.add(PuntoMontoMensual.builder()
                    .periodo(periodo.toString())
                    .total(total != null ? total : 0d)
                    .build());
        }

        return MontosMensualesResponse.builder()
                .organizacionId(organizacionId)
                .usuarioId(usuarioId)
                .periodoBase(periodoBase.toString())
                .mesesIncluidos(mesesSeguros)
                .datos(puntos)
                .build();
    }

    public MontosPorCategoriaResponse obtenerIngresosPorCategoria(
            Long organizacionId,
            String usuarioId,
            LocalDate fechaReferencia
    ) {
        // Para el dashboard, los montos por categoría se calculan a nivel empresa
        return obtenerMontosPorCategoria(organizacionId, null, fechaReferencia, TipoMovimiento.Ingreso);
    }

    public MontosPorCategoriaResponse obtenerEgresosPorCategoria(
            Long organizacionId,
            String usuarioId,
            LocalDate fechaReferencia
    ) {
        // Igual que ingresos, egresos por categoría se agregan a nivel empresa
        return obtenerMontosPorCategoria(organizacionId, null, fechaReferencia, TipoMovimiento.Egreso);
    }

    private MontosPorCategoriaResponse obtenerMontosPorCategoria(
            Long organizacionId,
            String usuarioId,
            LocalDate fechaReferencia,
            TipoMovimiento tipo
    ) {
        // OPTIMIZADO: Usa GROUP BY en BD en lugar de traer todos y agrupar en memoria
        if (organizacionId == null) {
            throw new IllegalArgumentException("Organizacion es obligatoria para el resumen por categoria");
        }

        LocalDate fechaBase = fechaReferencia != null ? fechaReferencia : LocalDate.now();
        int targetYear = fechaBase.getYear();
        LocalDate inicio = LocalDate.of(targetYear, 1, 1);
        LocalDate fin = LocalDate.of(targetYear, 12, 31);

        // Query optimizada con GROUP BY en BD
        List<Object[]> resultados = movimientoRepository.sumMontosPorCategoria(
                organizacionId,
                tipo,
                inicio.atStartOfDay(),
                fin.plusDays(1).atStartOfDay()
        );

        // Mapear resultados (ya vienen ordenados por monto DESC desde la query)
        List<MontoPorCategoria> categorias = resultados.stream()
                .map(row -> MontoPorCategoria.builder()
                        .categoria((String) row[0])
                        .total(row[1] != null ? ((Number) row[1]).doubleValue() : 0d)
                        .build())
                .toList();

        return MontosPorCategoriaResponse.builder()
                .organizacionId(organizacionId)
                .usuarioId(usuarioId)
                .periodo(String.valueOf(targetYear))
                .categorias(categorias)
                .build();
    }

    public ConciliacionResumenResponse obtenerResumenConciliacion(
            Long organizacionId,
            String usuarioId,
            LocalDate fechaReferencia
    ) {
        if (organizacionId == null && (usuarioId == null || usuarioId.isBlank())) {
            throw new IllegalArgumentException("Organizacion o usuario son requeridos para el resumen de conciliacion");
        }

        LocalDate fechaBase = fechaReferencia != null ? fechaReferencia : LocalDate.now();
        YearMonth periodo = YearMonth.from(fechaBase);
        LocalDate inicio = periodo.atDay(1);
        LocalDate fin = periodo.atEndOfMonth();

        long total = movimientoRepository.countByOrganizacionOrUsuarioAndFechaEmisionBetween(
                organizacionId,
                usuarioId,
                inicio.atStartOfDay(),
                fin.plusDays(1).atStartOfDay()
        );

        long conciliados = movimientoRepository.countConciliadosByOrganizacionOrUsuarioAndFechaEmisionBetween(
                organizacionId,
                usuarioId,
                inicio.atStartOfDay(),
                fin.plusDays(1).atStartOfDay()
        );

        long pendientes = movimientoRepository.countPendientesByOrganizacionOrUsuarioAndFechaEmisionBetween(
                organizacionId,
                usuarioId,
                inicio.atStartOfDay(),
                fin.plusDays(1).atStartOfDay()
        );

        double porcentaje = total > 0 ? (conciliados * 100d) / total : 0d;

        LocalDateTime ultimaConciliacionDateTime = movimientoRepository.findUltimaConciliacion(
                organizacionId,
                usuarioId,
                inicio.atStartOfDay(),
                fin.plusDays(1).atStartOfDay()
        );

        LocalDate ultimaConciliacion = ultimaConciliacionDateTime != null
                ? ultimaConciliacionDateTime.toLocalDate()
                : null;

        LocalDateTime ultimoPendienteDateTime = movimientoRepository.findUltimoMovimientoPendiente(
                organizacionId,
                usuarioId,
                inicio.atStartOfDay(),
                fin.plusDays(1).atStartOfDay()
        );

        LocalDate ultimoPendiente = ultimoPendienteDateTime != null
                ? ultimoPendienteDateTime.toLocalDate()
                : null;

        List<Object[]> porTipoRaw = movimientoRepository.obtenerResumenConciliacionPorTipo(
                organizacionId,
                usuarioId,
                inicio.atStartOfDay(),
                fin.plusDays(1).atStartOfDay()
        );

        List<ConciliacionTipoResumen> porTipo = porTipoRaw.stream()
                .map(item -> {
                    TipoMovimiento tipo = (TipoMovimiento) item[0];
                    long totalTipo = item[1] != null ? ((Number) item[1]).longValue() : 0L;
                    long conciliadosTipo = item[2] != null ? ((Number) item[2]).longValue() : 0L;
                    long pendientesTipo = Math.max(totalTipo - conciliadosTipo, 0L);
                    
                    // Obtener montos (índices 3, 4, 5)
                    Double montoTotal = item[3] != null ? ((Number) item[3]).doubleValue() : 0.0;
                    Double montoConciliado = item[4] != null ? ((Number) item[4]).doubleValue() : 0.0;
                    Double montoPendiente = item[5] != null ? ((Number) item[5]).doubleValue() : 0.0;
                    
                    // Calcular porcentaje
                    double porcentajeTipo = totalTipo > 0 ? (conciliadosTipo * 100.0) / totalTipo : 0.0;
                    
                    // Si es Egreso, convertir a negativo (asegurar que sean valores negativos)
                    if (tipo == TipoMovimiento.Egreso) {
                        montoTotal = montoTotal != null ? -Math.abs(montoTotal) : 0.0;
                        montoConciliado = montoConciliado != null ? -Math.abs(montoConciliado) : 0.0;
                        montoPendiente = montoPendiente != null ? -Math.abs(montoPendiente) : 0.0;
                    }
                    
                    return ConciliacionTipoResumen.builder()
                            .tipo(tipo != null ? tipo.name() : "SIN_TIPO")
                            .total(totalTipo)
                            .conciliados(conciliadosTipo)
                            .pendientes(pendientesTipo)
                            .porcentaje(porcentajeTipo)
                            .montoTotal(montoTotal)
                            .montoConciliado(montoConciliado)
                            .montoPendiente(montoPendiente)
                            .build();
                })
                .toList();

        return ConciliacionResumenResponse.builder()
                .organizacionId(organizacionId)
                .usuarioId(usuarioId)
                .periodo(periodo.toString())
                .totalMovimientos(total)
                .conciliados(conciliados)
                .pendientes(pendientes)
                .porcentajeConciliados(porcentaje)
                .ultimaConciliacion(ultimaConciliacion)
                .ultimoPendiente(ultimoPendiente)
                .porTipo(porTipo)
                .build();
    }

    private QueryResult calcularSumas(Long organizacionId, String usuarioId, LocalDate inicio, LocalDate fin) {
        Double ingresos = movimientoRepository.sumMontoByOrganizacionOrUsuarioAndTipoAndFechaBetween(
                organizacionId,
                usuarioId,
                TipoMovimiento.Ingreso,
                inicio.atStartOfDay(),
                fin.plusDays(1).atStartOfDay()
        );

        Double egresos = movimientoRepository.sumMontoByOrganizacionOrUsuarioAndTipoAndFechaBetween(
                organizacionId,
                usuarioId,
                TipoMovimiento.Egreso,
                inicio.atStartOfDay(),
                fin.plusDays(1).atStartOfDay()
        );

        long totalMovimientos = movimientoRepository.countByOrganizacionOrUsuarioAndFechaEmisionBetween(
                organizacionId,
                usuarioId,
                inicio.atStartOfDay(),
                fin.plusDays(1).atStartOfDay()
        );

        return new QueryResult(
                ingresos != null ? ingresos : 0d,
                egresos != null ? egresos : 0d,
                totalMovimientos
        );
    }

    private record QueryResult(double ingresos, double egresos, long totalMovimientos) {}

    public Double obtenerSaldoTotalEmpresa(Long organizacionId) {
        if (organizacionId == null) {
            throw new IllegalArgumentException("Se requiere organizacionId para calcular el saldo total");
        }

        // Rango amplio: desde 1970 hasta hoy inclusive
        LocalDate inicioFecha = LocalDate.of(1970, 1, 1);
        LocalDate finFecha = LocalDate.now().plusDays(1); // inclusivo hasta fin de hoy

        LocalDateTime inicio = inicioFecha.atStartOfDay();
        LocalDateTime fin = finFecha.atStartOfDay();

        Double ingresos = movimientoRepository.sumMontoByOrganizacionOrUsuarioAndTipoAndFechaBetween(
                organizacionId,
                null,
                TipoMovimiento.Ingreso,
                inicio,
                fin
        );

        Double egresos = movimientoRepository.sumMontoByOrganizacionOrUsuarioAndTipoAndFechaBetween(
                organizacionId,
                null,
                TipoMovimiento.Egreso,
                inicio,
                fin
        );

        double totalIngresos = ingresos != null ? ingresos : 0d;
        double totalEgresos = egresos != null ? egresos : 0d;

        // Egresos ya son negativos, devolvemos la suma algebraica
        return totalIngresos + totalEgresos;
    }

    /**
     * Obtiene movimientos agrupados mensualmente para presupuestos con caché
     * Reemplaza las múltiples llamadas individuales por mes
     */
    @Cacheable(value = "movimientosPresupuesto", key = "#organizacionId + '_' + #fechaDesde + '_' + #fechaHasta")
    public MovimientosPresupuestoResponse obtenerMovimientosParaPresupuesto(
            Long organizacionId, LocalDate fechaDesde, LocalDate fechaHasta) {
        
        if (organizacionId == null) {
            throw new IllegalArgumentException("Se requiere organizacionId");
        }
        if (fechaDesde == null || fechaHasta == null) {
            throw new IllegalArgumentException("Se requieren fechaDesde y fechaHasta");
        }

        LocalDateTime inicioDateTime = fechaDesde.atStartOfDay();
        LocalDateTime finDateTime = fechaHasta.atTime(23, 59, 59);

        // Obtener todos los movimientos del rango
        List<Movimiento> movimientos = movimientoRepository.findByOrganizacionIdAndFechaEmisionBetween(
                organizacionId, inicioDateTime, finDateTime);

        // Agrupar por mes
        Map<String, List<Movimiento>> movimientosPorMes = movimientos.stream()
                .collect(Collectors.groupingBy(m -> {
                    if (m.getFechaEmision() != null) {
                        return YearMonth.from(m.getFechaEmision()).toString(); // "YYYY-MM"
                    }
                    return "sin-fecha";
                }));

        // Procesar cada mes
        List<MovimientosPresupuestoResponse.MovimientosMensuales> datosMensuales = new ArrayList<>();
        
        // Generar todos los meses en el rango
        YearMonth inicio = YearMonth.from(fechaDesde);
        YearMonth fin = YearMonth.from(fechaHasta);
        
        for (YearMonth mes = inicio; !mes.isAfter(fin); mes = mes.plusMonths(1)) {
            String mesKey = mes.toString();
            List<Movimiento> movimientosMes = movimientosPorMes.getOrDefault(mesKey, new ArrayList<>());
            
            MovimientosPresupuestoResponse.MovimientosMensuales datosMes = procesarMovimientosMes(mesKey, movimientosMes);
            datosMensuales.add(datosMes);
        }

        // Calcular resumen total
        MovimientosPresupuestoResponse.ResumenTotal resumenTotal = calcularResumenTotal(datosMensuales);

        return MovimientosPresupuestoResponse.builder()
                .organizacionId(organizacionId)
                .fechaDesde(fechaDesde.toString())
                .fechaHasta(fechaHasta.toString())
                .datosMensuales(datosMensuales)
                .resumenTotal(resumenTotal)
                .build();
    }

    private MovimientosPresupuestoResponse.MovimientosMensuales procesarMovimientosMes(
            String mes, List<Movimiento> movimientos) {
        
        // Separar por tipo
        List<Movimiento> ingresos = movimientos.stream()
                .filter(m -> TipoMovimiento.Ingreso.equals(m.getTipo()))
                .collect(Collectors.toList());
                
        List<Movimiento> egresos = movimientos.stream()
                .filter(m -> TipoMovimiento.Egreso.equals(m.getTipo()))
                .collect(Collectors.toList());

        // Calcular totales
        BigDecimal totalIngresos = ingresos.stream()
                .map(m -> BigDecimal.valueOf(Math.abs(m.getMontoTotal() != null ? m.getMontoTotal() : 0.0)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        BigDecimal totalEgresos = egresos.stream()
                .map(m -> BigDecimal.valueOf(Math.abs(m.getMontoTotal() != null ? m.getMontoTotal() : 0.0)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Agrupar por categoría
        List<MovimientosPresupuestoResponse.MovimientoPorCategoria> ingresosPorCategoria = 
                agruparPorCategoria(ingresos, totalIngresos);
                
        List<MovimientosPresupuestoResponse.MovimientoPorCategoria> egresosPorCategoria = 
                agruparPorCategoria(egresos, totalEgresos);

        return MovimientosPresupuestoResponse.MovimientosMensuales.builder()
                .mes(mes)
                .totalIngresos(totalIngresos)
                .totalEgresos(totalEgresos)
                .saldoMensual(totalIngresos.subtract(totalEgresos))
                .cantidadIngresos(ingresos.size())
                .cantidadEgresos(egresos.size())
                .ingresosPorCategoria(ingresosPorCategoria)
                .egresosPorCategoria(egresosPorCategoria)
                .build();
    }

    private List<MovimientosPresupuestoResponse.MovimientoPorCategoria> agruparPorCategoria(
            List<Movimiento> movimientos, BigDecimal totalTipo) {
        
        Map<String, List<Movimiento>> porCategoria = movimientos.stream()
                .collect(Collectors.groupingBy(m -> 
                    m.getCategoria() != null ? m.getCategoria() : "Sin categoría"));

        return porCategoria.entrySet().stream()
                .map(entry -> {
                    String categoria = entry.getKey();
                    List<Movimiento> movimientosCategoria = entry.getValue();
                    
                    BigDecimal montoCategoria = movimientosCategoria.stream()
                            .map(m -> BigDecimal.valueOf(Math.abs(m.getMontoTotal() != null ? m.getMontoTotal() : 0.0)))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    BigDecimal porcentaje = totalTipo.compareTo(BigDecimal.ZERO) > 0 
                            ? montoCategoria.multiply(BigDecimal.valueOf(100)).divide(totalTipo, 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    
                    return MovimientosPresupuestoResponse.MovimientoPorCategoria.builder()
                            .categoria(categoria)
                            .monto(montoCategoria)
                            .cantidad(movimientosCategoria.size())
                            .porcentaje(porcentaje)
                            .build();
                })
                .sorted((a, b) -> b.getMonto().compareTo(a.getMonto())) // Ordenar por monto desc
                .collect(Collectors.toList());
    }

    private MovimientosPresupuestoResponse.ResumenTotal calcularResumenTotal(
            List<MovimientosPresupuestoResponse.MovimientosMensuales> datosMensuales) {
        
        BigDecimal totalIngresos = datosMensuales.stream()
                .map(MovimientosPresupuestoResponse.MovimientosMensuales::getTotalIngresos)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        BigDecimal totalEgresos = datosMensuales.stream()
                .map(MovimientosPresupuestoResponse.MovimientosMensuales::getTotalEgresos)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        Integer totalMovimientos = datosMensuales.stream()
                .mapToInt(m -> m.getCantidadIngresos() + m.getCantidadEgresos())
                .sum();
                
        Integer mesesConDatos = (int) datosMensuales.stream()
                .filter(m -> m.getCantidadIngresos() > 0 || m.getCantidadEgresos() > 0)
                .count();

        return MovimientosPresupuestoResponse.ResumenTotal.builder()
                .totalIngresos(totalIngresos)
                .totalEgresos(totalEgresos)
                .saldoTotal(totalIngresos.subtract(totalEgresos))
                .totalMovimientos(totalMovimientos)
                .mesesConDatos(mesesConDatos)
                .build();
    }
}





