package registro.cargarDatos.dtos;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;

@Value
@Builder
public class ResumenMensualResponse {

    Long organizacionId;
    String usuarioId;
    boolean coincideUsuario;
    String periodo;
    LocalDate periodoInicio;
    LocalDate periodoFin;
    Double ingresosTotales;
    Double egresosTotales;
    Double resultadoNeto;
    Long totalMovimientos;
}
