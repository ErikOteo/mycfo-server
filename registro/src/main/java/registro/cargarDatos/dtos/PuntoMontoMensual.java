package registro.cargarDatos.dtos;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PuntoMontoMensual {
    String periodo; // formato YYYY-MM
    Double total;
}
