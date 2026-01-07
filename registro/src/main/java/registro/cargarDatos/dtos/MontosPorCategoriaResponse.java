package registro.cargarDatos.dtos;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class MontosPorCategoriaResponse {

    Long organizacionId;
    String usuarioId;
    String periodo;
    List<MontoPorCategoria> categorias;
}
