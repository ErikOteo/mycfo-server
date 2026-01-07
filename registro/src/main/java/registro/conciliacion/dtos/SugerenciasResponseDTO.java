package registro.conciliacion.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para la respuesta que contiene sugerencias de documentos para un movimiento
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SugerenciasResponseDTO {
    
    private MovimientoDTO movimiento;
    
    private List<DocumentoSugeridoDTO> sugerencias;
    
    private Integer totalSugerencias;
}

