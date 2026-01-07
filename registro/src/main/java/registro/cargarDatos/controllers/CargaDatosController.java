package registro.cargarDatos.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import registro.cargarDatos.dtos.CargaDatosResponse;
import registro.cargarDatos.models.*;
import registro.cargarDatos.services.*;
import registro.services.AdministracionService;

import java.util.Map;

/**
 * Controlador unificado para la carga de datos
 * Maneja facturas, recibos, pagarés y movimientos
 * Soporta múltiples métodos: formulario, excel, voz, audio
 * 
 * FLUJO:
 * 1. Usuario envía datos con header X-Usuario-Sub
 * 2. Sistema obtiene automáticamente el ID de empresa desde Administración
 * 3. Guarda el documento/movimiento con empresa asignada
 */
@RestController
@RequestMapping("/api/carga-datos")
@RequiredArgsConstructor
@Slf4j
public class CargaDatosController {

    private final FacturaService facturaService;
    private final MovimientoService movimientoService;
    private final AdministracionService administracionService;
    private final ObjectMapper objectMapper;

    /**
     * Endpoint unificado para cargar datos mediante formulario, voz o audio
     * POST /api/carga-datos
     * 
     * El usuario envía:
     * - Header: X-Usuario-Sub (requerido)
     * - Body: { tipo, metodo, tipoMovimiento (opcional), datos }
     * 
     * El sistema obtiene automáticamente el ID de empresa del usuario
     */
    @PostMapping
    public ResponseEntity<CargaDatosResponse> cargarDatos(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-Usuario-Sub") String usuarioSub) {
        
        try {
            // Validar que el usuarioSub esté presente
            if (usuarioSub == null || usuarioSub.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                    new CargaDatosResponse(false, "Header X-Usuario-Sub es requerido", null, null)
                );
            }
            
            // Obtener empresa del usuario automáticamente
            Long empresaId;
            try {
                empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
                log.info("Empresa ID obtenida: {} para usuario: {}", empresaId, usuarioSub);
            } catch (RuntimeException e) {
                log.error("Error obteniendo empresa del usuario: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    new CargaDatosResponse(false, "Usuario no tiene empresa asociada: " + e.getMessage(), null, null)
                );
            }
            
            String tipo = (String) payload.get("tipo");
            String metodo = (String) payload.get("metodo");
            @SuppressWarnings("unchecked")
            Map<String, Object> datos = (Map<String, Object>) payload.get("datos");
            
            if (tipo == null || datos == null) {
                return ResponseEntity.badRequest().body(
                    new CargaDatosResponse(false, "Faltan campos requeridos: tipo y datos", null, null)
                );
            }
            
            // Establecer usuario y organización automáticamente
            datos.put("usuarioId", usuarioSub);
            datos.put("organizacionId", empresaId);
            
            Object resultado = null;
            Long id = null;
            
            // Procesar según el tipo de documento/movimiento
            switch (tipo.toLowerCase()) {
                case "factura":
                    log.info("Guardando factura para usuario: {} en empresa: {}", usuarioSub, empresaId);
                    Factura factura = objectMapper.convertValue(datos, Factura.class);
                    Factura facturaGuardada = facturaService.guardarFactura(factura);
                    resultado = facturaGuardada;
                    id = facturaGuardada.getIdDocumento();
                    break;
                    
                case "movimiento":
                    log.info("Guardando movimiento para usuario: {} en empresa: {}", usuarioSub, empresaId);
                    Movimiento movimiento = objectMapper.convertValue(datos, Movimiento.class);
                    
                    // Setear el tipo de movimiento si viene en el payload
                    String tipoMovimientoStr = (String) payload.get("tipoMovimiento");
                    if (tipoMovimientoStr != null) {
                        movimiento.setTipo(TipoMovimiento.valueOf(tipoMovimientoStr));
                    }
                    
                    Movimiento movimientoGuardado = movimientoService.guardarMovimiento(movimiento);
                    resultado = movimientoGuardado;
                    id = movimientoGuardado.getId();
                    break;
                    
                default:
                    return ResponseEntity.badRequest().body(
                        new CargaDatosResponse(false, "Tipo de documento no soportado: " + tipo, null, null)
                    );
            }
            
            String mensajeMetodo = metodo != null ? " mediante " + metodo : "";
            log.info("{} guardado exitosamente con ID: {}", tipo, id);
            
            return ResponseEntity.ok(
                new CargaDatosResponse(
                    true, 
                    tipo.substring(0, 1).toUpperCase() + tipo.substring(1) + " guardado exitosamente" + mensajeMetodo,
                    id,
                    resultado
                )
            );
            
        } catch (IllegalArgumentException e) {
            log.error("Error de validación: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                new CargaDatosResponse(false, "Datos inválidos: " + e.getMessage(), null, null)
            );
        } catch (Exception e) {
            log.error("Error procesando solicitud: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new CargaDatosResponse(false, "Error al procesar la solicitud: " + e.getMessage(), null, null)
            );
        }
    }

}
