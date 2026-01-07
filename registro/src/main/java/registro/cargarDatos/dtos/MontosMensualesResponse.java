package registro.cargarDatos.dtos;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class MontosMensualesResponse {

    Long organizacionId;
    String usuarioId;
    String periodoBase;
    int mesesIncluidos;
    List<PuntoMontoMensual> datos;
}
