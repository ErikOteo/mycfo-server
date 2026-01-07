package registro.conciliacion.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import registro.cargarDatos.models.TipoMoneda;

import java.time.LocalDate;

/**
 * DTO para representar un documento comercial sugerido para conciliación
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoSugeridoDTO {
    
    private Long idDocumento;
    
    private String tipoDocumento; // "FACTURA", "PAGARE", "RECIBO"
    
    private String numeroDocumento;
    
    private LocalDate fechaEmision;
    
    private Double montoTotal;
    
    private TipoMoneda moneda;
    
    private String categoria;
    
    // Información específica según el tipo de documento
    private String nombreRelacionado; // vendedor/comprador para factura, beneficiario/deudor para pagaré, etc.
    
    private String cuit; // CUIT relacionado si existe
    
    // Score de coincidencia (0-100)
    private Integer scoreCoincidencia;
    
    // Nivel de sugerencia: "ALTA", "MEDIA", "BAJA"
    private String nivelSugerencia;
    
    // Razones de la sugerencia
    private String razonSugerencia;
}

