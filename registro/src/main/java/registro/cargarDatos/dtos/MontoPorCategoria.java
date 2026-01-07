package registro.cargarDatos.dtos;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class MontoPorCategoria {
    String categoria;
    Double total;
}
