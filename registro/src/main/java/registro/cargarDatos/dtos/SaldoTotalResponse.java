package registro.cargarDatos.dtos;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SaldoTotalResponse {

    Long organizacionId;
    Double saldoTotal;
}
