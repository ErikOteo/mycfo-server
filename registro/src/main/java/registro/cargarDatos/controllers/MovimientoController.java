package registro.cargarDatos.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import registro.cargarDatos.dtos.ConciliacionResumenResponse;
import registro.cargarDatos.dtos.DashboardSummaryResponse;
import registro.cargarDatos.dtos.MontosMensualesResponse;
import registro.cargarDatos.dtos.MontosPorCategoriaResponse;
import registro.cargarDatos.dtos.MovimientosPresupuestoResponse;
import registro.cargarDatos.dtos.ResumenMensualResponse;
import registro.cargarDatos.dtos.SaldoTotalResponse;
import registro.cargarDatos.models.Factura;
import registro.cargarDatos.models.Movimiento;
import registro.cargarDatos.models.TipoMoneda;
import registro.cargarDatos.models.TipoMovimiento;
import registro.cargarDatos.services.FacturaService;
import registro.cargarDatos.services.MovimientoService;
import registro.services.AdministracionService;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/movimientos")
@RequiredArgsConstructor
@Slf4j
public class MovimientoController {

    private final MovimientoService movimientoService;
    private final FacturaService facturaService;
    private final AdministracionService administracionService;

    /**
     * Crear un nuevo movimiento
     * El usuario envía el sub en el header X-Usuario-Sub
     * El sistema obtiene automáticamente el ID de empresa del usuario
     */
    @PostMapping
    public ResponseEntity<Movimiento> crearMovimiento(
            @RequestBody Movimiento movimiento,
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub) {
        
        try {
            // Establecer usuario desde el header
            movimiento.setUsuarioId(usuarioSub);
            
            // Obtener ID de empresa automáticamente desde administración
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            movimiento.setOrganizacionId(empresaId);
            
            log.info("Creando movimiento para usuario: {} en empresa: {}", usuarioSub, empresaId);
            
            Movimiento guardado = movimientoService.guardarMovimiento(movimiento);
            return ResponseEntity.ok(guardado);
            
        } catch (RuntimeException e) {
            log.error("Error al crear movimiento: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtener un movimiento por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Movimiento> obtenerMovimiento(@PathVariable Long id) {
        Movimiento movimiento = movimientoService.obtenerMovimiento(id);
        if (movimiento == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(movimiento);
    }

    /**
     * Actualizar un movimiento
     */
    @PutMapping("/{id}")
    public ResponseEntity<Movimiento> actualizarMovimiento(
            @PathVariable Long id,
            @RequestBody Movimiento movimiento,
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub) {
        try {
            // Obtener el movimiento existente para verificar permisos
            Movimiento existente = movimientoService.obtenerMovimiento(id);
            if (existente == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Verificar que el usuario tenga permisos (mismo usuario o misma empresa)
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            if (!existente.getOrganizacionId().equals(empresaId)) {
                log.warn("Usuario {} intentó editar movimiento de otra empresa", usuarioSub);
                return ResponseEntity.status(403).build();
            }
            
            log.info("Actualizando movimiento {} para usuario: {}", id, usuarioSub);
            Movimiento actualizado = movimientoService.actualizarMovimiento(id, movimiento);
            return ResponseEntity.ok(actualizado);
            
        } catch (RuntimeException e) {
            log.error("Error al actualizar movimiento {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Eliminar un movimiento
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarMovimiento(
            @PathVariable Long id,
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub) {
        try {
            // Obtener el movimiento existente para verificar permisos
            Movimiento existente = movimientoService.obtenerMovimiento(id);
            if (existente == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Verificar que el usuario tenga permisos
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            if (!existente.getOrganizacionId().equals(empresaId)) {
                log.warn("Usuario {} intentó eliminar movimiento de otra empresa", usuarioSub);
                return ResponseEntity.status(403).build();
            }
            
            log.info("Eliminando movimiento {} para usuario: {}", id, usuarioSub);
            movimientoService.eliminarMovimiento(id);
            return ResponseEntity.noContent().build();
            
        } catch (RuntimeException e) {
            log.error("Error al eliminar movimiento {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtener movimientos del usuario actual con filtros y paginación
     * Automáticamente filtra por la empresa del usuario
     */
    @GetMapping
    public ResponseEntity<Page<Movimiento>> obtenerMovimientos(
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) List<TipoMovimiento> tipos,
            @RequestParam(required = false) Boolean conciliado,
            @RequestParam(required = false) String nombreRelacionado,
            @RequestParam(required = false) String moneda,
            @RequestParam(required = false) Double montoMin,
            @RequestParam(required = false) Double montoMax,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate searchDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fechaEmision") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        try {
            // Obtener empresa del usuario
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);

            TipoMoneda monedaEnum = null;
            if (moneda != null) {
                try {
                    monedaEnum = TipoMoneda.fromString(moneda);
                } catch (IllegalArgumentException ex) {
                    return ResponseEntity.badRequest().build();
                }
            }
            
            Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            
            log.debug("Obteniendo movimientos para empresa: {}", empresaId);
            
            Page<Movimiento> movimientos = movimientoService.obtenerMovimientos(
                    empresaId,
                    null, // usuarioId - null para traer todos de la empresa
                    fechaDesde,
                    fechaHasta,
                    tipos,
                    conciliado,
                    nombreRelacionado,
                    monedaEnum,
                    montoMin,
                    montoMax,
                    search,
                    searchDate,
                    pageable
            );
            
            return ResponseEntity.ok(movimientos);
            
        } catch (RuntimeException e) {
            log.error("Error al obtener movimientos: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Obtener todos los movimientos sin paginación
     */
    @GetMapping("/todos")
    public ResponseEntity<List<Movimiento>> obtenerTodosLosMovimientos(
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) List<TipoMovimiento> tipos,
            @RequestParam(required = false) Boolean conciliado,
            @RequestParam(required = false) String nombreRelacionado,
            @RequestParam(required = false) String moneda,
            @RequestParam(required = false) Double montoMin,
            @RequestParam(required = false) Double montoMax,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate searchDate) {

        try {
            // Obtener empresa del usuario
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);

            TipoMoneda monedaEnum = null;
            if (moneda != null) {
                try {
                    monedaEnum = TipoMoneda.fromString(moneda);
                } catch (IllegalArgumentException ex) {
                    return ResponseEntity.badRequest().build();
                }
            }
            
            log.debug("Obteniendo todos los movimientos para empresa: {}", empresaId);
            
            List<Movimiento> movimientos = movimientoService.obtenerTodosLosMovimientos(
                    empresaId,
                    null, // usuarioId - null para traer todos de la empresa
                    fechaDesde,
                    fechaHasta,
                    tipos,
                    conciliado,
                    nombreRelacionado,
                    monedaEnum,
                    montoMin,
                    montoMax,
                    search,
                    searchDate
            );
            
            return ResponseEntity.ok(movimientos);
            
        } catch (RuntimeException e) {
            log.error("Error al obtener todos los movimientos: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Obtener movimientos agrupados por mes y tipo
     */
    @GetMapping("/mensuales")
    public ResponseEntity<Map<String, Map<TipoMovimiento, List<Movimiento>>>> obtenerMovimientosMensuales(
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) List<TipoMovimiento> tipos,
            @RequestParam(required = false) Boolean conciliado,
            @RequestParam(required = false) String nombreRelacionado) {
        
        try {
            // Obtener empresa del usuario
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            
            log.debug("Obteniendo movimientos mensuales para empresa: {}", empresaId);
            
            Map<String, Map<TipoMovimiento, List<Movimiento>>> movimientosMensuales = 
                    movimientoService.obtenerMovimientosPorMes(
                            empresaId,
                            null, // usuarioId - null para traer todos de la empresa
                            fechaDesde,
                            fechaHasta,
                            tipos,
                            conciliado,
                            nombreRelacionado,
                            null,
                            null
                    );
            
            return ResponseEntity.ok(movimientosMensuales);
            
        } catch (RuntimeException e) {
            log.error("Error al obtener movimientos mensuales: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Endpoint interno para comunicación entre microservicios
     * Obtiene movimientos mensuales por organizacionId directamente
     */
    @GetMapping("/empresa/{organizacionId}/mensuales")
    public ResponseEntity<Map<String, Map<TipoMovimiento, List<Movimiento>>>> obtenerMovimientosMensualesPorEmpresa(
            @PathVariable Long organizacionId) {
        
        try {
            log.debug("Obteniendo movimientos mensuales para empresa: {} (endpoint interno)", organizacionId);
            
            Map<String, Map<TipoMovimiento, List<Movimiento>>> movimientosMensuales = 
                    movimientoService.obtenerMovimientosPorMes(
                            organizacionId,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null
                    );
            
            return ResponseEntity.ok(movimientosMensuales);
            
        } catch (RuntimeException e) {
            log.error("Error al obtener movimientos mensuales: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/resumen/mensual")
    public ResponseEntity<ResumenMensualResponse> obtenerResumenMensual(
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        try {
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            // Para reportes/ dashboard queremos siempre el resumen a nivel empresa,
            // no por usuario individual, por eso pasamos usuarioId = null
            ResumenMensualResponse resumen = movimientoService.obtenerResumenMensual(empresaId, null, fecha);
            return ResponseEntity.ok(resumen);
        } catch (RuntimeException e) {
            log.error("Error al obtener resumen mensual: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/resumen/dashboard")
    public ResponseEntity<DashboardSummaryResponse> obtenerResumenDashboard(
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false, defaultValue = "12") Integer meses,
            @RequestParam(required = false, defaultValue = "6") Integer limiteMovimientos,
            @RequestParam(required = false, defaultValue = "6") Integer limiteFacturas,
            @RequestParam(required = false) String moneda
    ) {
        try {
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);

            TipoMoneda monedaEnum = null;
            if (moneda != null) {
                try {
                    monedaEnum = TipoMoneda.fromString(moneda);
                } catch (IllegalArgumentException ex) {
                    return ResponseEntity.badRequest().build();
                }
            }

            LocalDate fechaBase = fecha != null ? fecha : LocalDate.now();
            int mesesSeguros = meses != null ? meses : 12;
            int limiteMovsSeguros = limiteMovimientos != null ? Math.max(limiteMovimientos, 1) : 6;
            int limiteFactSeguros = limiteFacturas != null ? Math.max(limiteFacturas, 1) : 6;

            ResumenMensualResponse resumenMensual = movimientoService.obtenerResumenMensual(empresaId, null, fechaBase, monedaEnum);
            MontosMensualesResponse ingresosMensuales = movimientoService.obtenerIngresosMensuales(
                    empresaId,
                    usuarioSub,
                    fechaBase,
                    mesesSeguros,
                    monedaEnum
            );
            MontosMensualesResponse egresosMensuales = movimientoService.obtenerEgresosMensuales(
                    empresaId,
                    usuarioSub,
                    fechaBase,
                    mesesSeguros,
                    monedaEnum
            );
            MontosPorCategoriaResponse ingresosPorCategoria = movimientoService.obtenerIngresosPorCategoria(
                    empresaId,
                    usuarioSub,
                    fechaBase,
                    monedaEnum
            );
            MontosPorCategoriaResponse egresosPorCategoria = movimientoService.obtenerEgresosPorCategoria(
                    empresaId,
                    usuarioSub,
                    fechaBase,
                    monedaEnum
            );
            ConciliacionResumenResponse conciliacion = movimientoService.obtenerResumenConciliacion(
                    empresaId,
                    usuarioSub,
                    fechaBase,
                    monedaEnum
            );

            Double saldoTotalValor = movimientoService.obtenerSaldoTotalEmpresa(empresaId, monedaEnum);
            SaldoTotalResponse saldoTotal = SaldoTotalResponse.builder()
                    .organizacionId(empresaId)
                    .saldoTotal(saldoTotalValor)
                    .build();

            Pageable movimientosPageable = PageRequest.of(0, limiteMovsSeguros, Sort.by(Sort.Direction.DESC, "fechaEmision"));
            Page<Movimiento> movimientosPage = movimientoService.obtenerMovimientos(
                    empresaId,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    monedaEnum,
                    null,
                    null,
                    null,
                    null,
                    movimientosPageable
            );
            List<Movimiento> movimientosRecientes = movimientosPage.getContent();

            Pageable facturasPageable = PageRequest.of(0, limiteFactSeguros, Sort.by(Sort.Direction.DESC, "fechaEmision"));
            org.springframework.data.domain.Page<Factura> facturasPage = facturaService.listarPaginadasPorOrganizacion(
                    empresaId,
                    monedaEnum,
                    facturasPageable
            );
            List<Factura> facturasRecientes = facturasPage.getContent();

            DashboardSummaryResponse response = DashboardSummaryResponse.builder()
                    .resumenMensual(resumenMensual)
                    .saldoTotal(saldoTotal)
                    .ingresosMensuales(ingresosMensuales)
                    .egresosMensuales(egresosMensuales)
                    .ingresosPorCategoria(ingresosPorCategoria)
                    .egresosPorCategoria(egresosPorCategoria)
                    .conciliacion(conciliacion)
                    .movimientosRecientes(movimientosRecientes)
                    .facturasRecientes(facturasRecientes)
                    .build();

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener resumen de dashboard: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/resumen/ingresos-mensuales")
    public ResponseEntity<MontosMensualesResponse> obtenerIngresosMensuales(
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false, defaultValue = "12") Integer meses
    ) {
        try {
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            MontosMensualesResponse response = movimientoService.obtenerIngresosMensuales(
                    empresaId,
                    usuarioSub,
                    fecha,
                    meses != null ? meses : 12
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener ingresos mensuales: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/resumen/egresos-mensuales")
    public ResponseEntity<MontosMensualesResponse> obtenerEgresosMensuales(
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false, defaultValue = "12") Integer meses
    ) {
        try {
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            MontosMensualesResponse response = movimientoService.obtenerEgresosMensuales(
                    empresaId,
                    usuarioSub,
                    fecha,
                    meses != null ? meses : 12
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener egresos mensuales: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/resumen/ingresos-categorias")
    public ResponseEntity<MontosPorCategoriaResponse> obtenerIngresosPorCategoria(
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        try {
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            MontosPorCategoriaResponse response = movimientoService.obtenerIngresosPorCategoria(
                    empresaId,
                    usuarioSub,
                    fecha
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener ventas por categoría: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/resumen/egresos-categorias")
    public ResponseEntity<MontosPorCategoriaResponse> obtenerEgresosPorCategoria(
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        try {
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            MontosPorCategoriaResponse response = movimientoService.obtenerEgresosPorCategoria(
                    empresaId,
                    usuarioSub,
                    fecha
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener egresos por categoria: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/resumen/conciliacion")
    public ResponseEntity<ConciliacionResumenResponse> obtenerResumenConciliacion(
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        try {
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            ConciliacionResumenResponse response = movimientoService.obtenerResumenConciliacion(
                    empresaId,
                    usuarioSub,
                    fecha
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener resumen de conciliacion: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/resumen/saldo-total")
    public ResponseEntity<SaldoTotalResponse> obtenerSaldoTotalEmpresa(
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub
    ) {
        try {
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            Double saldoTotal = movimientoService.obtenerSaldoTotalEmpresa(empresaId);
            SaldoTotalResponse response = SaldoTotalResponse.builder()
                    .organizacionId(empresaId)
                    .saldoTotal(saldoTotal)
                    .build();
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener saldo total de la empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtener movimientos agrupados mensualmente para presupuestos
     * Reemplaza las múltiples llamadas individuales por mes
     */
    @GetMapping("/presupuesto/datos-completos")
    public ResponseEntity<MovimientosPresupuestoResponse> obtenerMovimientosParaPresupuesto(
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) String moneda
    ) {
        try {
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            TipoMoneda monedaEnum = null;
            if (moneda != null) {
                try {
                    monedaEnum = TipoMoneda.fromString(moneda);
                } catch (Exception e) {
                    return ResponseEntity.badRequest().build();
                }
            }
            
            log.info("Obteniendo movimientos para presupuesto - Empresa: {}, Desde: {}, Hasta: {}", 
                    empresaId, fechaDesde, fechaHasta);
            
            MovimientosPresupuestoResponse response = movimientoService.obtenerMovimientosParaPresupuesto(
                    empresaId, fechaDesde, fechaHasta, monedaEnum);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener movimientos para presupuesto: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

}
