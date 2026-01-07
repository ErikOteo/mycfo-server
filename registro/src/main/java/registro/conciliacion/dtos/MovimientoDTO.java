package registro.conciliacion.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import registro.cargarDatos.models.TipoMedioPago;
import registro.cargarDatos.models.TipoMoneda;
import registro.cargarDatos.models.TipoMovimiento;

import java.time.LocalDate;

/**
 * DTO para representar un movimiento en el panel de conciliación
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovimientoDTO {
    
    private Long id;
    
    private TipoMovimiento tipo;
    
    private Double montoTotal;
    
    private LocalDate fechaEmision;
    
    private String categoria;
    
    private String origen;
    
    private String destino;
    
    private String descripcion;
    
    private TipoMedioPago medioPago;
    
    private TipoMoneda moneda;
    
    // Información adicional para identificar la fuente del movimiento
    private String fuenteOrigen; // "EXCEL", "MERCADOPAGO", "MANUAL"
    
    // Si ya está conciliado
    private Boolean conciliado = false;
    
    private Long idDocumentoConciliado;
    
    private String numeroDocumentoConciliado;
    
    private String tipoDocumentoConciliado;
}

