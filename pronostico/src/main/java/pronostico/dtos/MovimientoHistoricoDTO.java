package pronostico.dtos;

import lombok.Data;

/**
 * DTO para representar movimientos históricos desde el servicio de Registro
 */
@Data
public class MovimientoHistoricoDTO {
    
    private Long id;
    private String tipo; // Ingreso, Egreso, Deuda, Acreencia
    private Double montoTotal;
    private String fechaEmision;
    private String descripcion;
    private String categoria;
    // Otros campos que puedas necesitar...
}

