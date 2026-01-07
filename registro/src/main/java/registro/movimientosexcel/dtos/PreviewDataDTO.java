package registro.movimientosexcel.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PreviewDataDTO {
    private List<RegistroPreviewDTO> registros;
    private Integer totalRegistros;
    private Integer registrosValidos;
    private List<FilaConErrorDTO> errores;
    private String tipoOrigen;
    
    public PreviewDataDTO(List<RegistroPreviewDTO> registros, Integer totalRegistros, 
                         Integer registrosValidos, List<FilaConErrorDTO> errores, String tipoOrigen) {
        this.registros = registros;
        this.totalRegistros = totalRegistros;
        this.registrosValidos = registrosValidos;
        this.errores = errores;
        this.tipoOrigen = tipoOrigen;
    }
}
