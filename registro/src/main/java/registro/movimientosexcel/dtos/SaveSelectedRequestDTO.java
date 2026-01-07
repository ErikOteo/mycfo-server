package registro.movimientosexcel.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SaveSelectedRequestDTO {
    private java.util.List<RegistroPreviewDTO> registrosSeleccionados;
    private String fileName;
    private String tipoOrigen;
}
