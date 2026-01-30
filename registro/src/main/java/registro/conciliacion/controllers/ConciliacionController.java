package registro.conciliacion.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import registro.services.AdministracionService;
import registro.conciliacion.dtos.ConciliacionRequestDTO;
import registro.conciliacion.dtos.DocumentoSugeridoDTO;
import registro.conciliacion.dtos.MovimientoDTO;
import registro.conciliacion.dtos.SugerenciasResponseDTO;
import registro.conciliacion.services.ConciliacionService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conciliacion")
@RequiredArgsConstructor
public class ConciliacionController {

    private final ConciliacionService conciliacionService;
    private final AdministracionService administracionService;

    /**
     * Obtiene movimientos sin conciliar con paginación
     */
    @GetMapping("/movimientos/sin-conciliar")
    public ResponseEntity<Page<MovimientoDTO>> obtenerMovimientosSinConciliar(
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fechaEmision") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String moneda) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        registro.cargarDatos.models.TipoMoneda monedaEnum = null;
        if (moneda != null) {
            try {
                monedaEnum = registro.cargarDatos.models.TipoMoneda.fromString(moneda);
            } catch (Exception e) {
                return ResponseEntity.badRequest().build();
            }
        }

        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);

        Page<MovimientoDTO> movimientos = conciliacionService.obtenerMovimientosSinConciliar(pageable, empresaId,
                monedaEnum);
        return ResponseEntity.ok(movimientos);
    }

    /**
     * Obtiene todos los movimientos (conciliados y sin conciliar) con paginación
     */
    @GetMapping("/movimientos")
    public ResponseEntity<Page<MovimientoDTO>> obtenerTodosLosMovimientos(
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fechaEmision") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String moneda) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        registro.cargarDatos.models.TipoMoneda monedaEnum = null;
        if (moneda != null) {
            try {
                monedaEnum = registro.cargarDatos.models.TipoMoneda.fromString(moneda);
            } catch (Exception e) {
                return ResponseEntity.badRequest().build();
            }
        }

        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);

        Page<MovimientoDTO> movimientos = conciliacionService.obtenerTodosLosMovimientos(pageable, empresaId,
                monedaEnum);
        return ResponseEntity.ok(movimientos);
    }

    /**
     * Sugiere documentos para un movimiento específico
     */
    @GetMapping("/movimientos/{movimientoId}/sugerencias")
    public ResponseEntity<SugerenciasResponseDTO> obtenerSugerencias(@RequestHeader("X-Usuario-Sub") String usuarioSub,
            @PathVariable Long movimientoId,
            @RequestParam(required = false) String moneda) {
        registro.cargarDatos.models.TipoMoneda monedaEnum = null;
        if (moneda != null) {
            try {
                monedaEnum = registro.cargarDatos.models.TipoMoneda.fromString(moneda);
            } catch (Exception e) {
                return ResponseEntity.badRequest().build();
            }
        }

        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);

        List<DocumentoSugeridoDTO> sugerencias = conciliacionService.sugerirDocumentos(movimientoId, empresaId,
                monedaEnum);

        // Obtener el movimiento para incluirlo en la respuesta
        List<MovimientoDTO> movimientos = conciliacionService.obtenerTodosLosMovimientosPorMoneda(empresaId,
                monedaEnum);
        MovimientoDTO movimiento = movimientos.stream()
                .filter(m -> m.getId().equals(movimientoId))
                .findFirst()
                .orElse(null);

        SugerenciasResponseDTO response = new SugerenciasResponseDTO();
        response.setMovimiento(movimiento);
        response.setSugerencias(sugerencias);
        response.setTotalSugerencias(sugerencias.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Vincula un movimiento con un documento
     */
    @PostMapping("/vincular")
    public ResponseEntity<MovimientoDTO> vincularMovimiento(@RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestBody ConciliacionRequestDTO request) {
        try {
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);

            MovimientoDTO movimiento = conciliacionService.vincularMovimientoConDocumento(
                    request.getMovimientoId(),
                    request.getDocumentoId(),
                    empresaId);
            return ResponseEntity.ok(movimiento);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Desvincula un movimiento de su documento
     */
    @PostMapping("/desvincular/{movimientoId}")
    public ResponseEntity<MovimientoDTO> desvincularMovimiento(@RequestHeader("X-Usuario-Sub") String usuarioSub,
            @PathVariable Long movimientoId) {
        try {
            Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);

            MovimientoDTO movimiento = conciliacionService.desvincularMovimiento(movimientoId, empresaId);
            return ResponseEntity.ok(movimiento);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtiene estadísticas de conciliación
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas(@RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestParam(required = false) String moneda) {
        registro.cargarDatos.models.TipoMoneda monedaEnum = null;
        if (moneda != null) {
            try {
                monedaEnum = registro.cargarDatos.models.TipoMoneda.fromString(moneda);
            } catch (Exception e) {
                return ResponseEntity.badRequest().build();
            }
        }

        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        Map<String, Object> stats = conciliacionService.obtenerResumenEstadisticas(empresaId, monedaEnum);
        return ResponseEntity.ok(stats);
    }
}
