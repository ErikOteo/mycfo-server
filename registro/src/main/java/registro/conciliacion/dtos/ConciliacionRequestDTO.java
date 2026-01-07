package registro.conciliacion.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la solicitud de vincular un movimiento con un documento
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConciliacionRequestDTO {
    
    private Long movimientoId;
    
    private Long documentoId;
}

