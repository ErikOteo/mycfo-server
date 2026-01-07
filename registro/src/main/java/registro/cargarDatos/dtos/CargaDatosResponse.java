package registro.cargarDatos.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CargaDatosResponse {
    private boolean exito;
    private String mensaje;
    private Long id;
    private Object datos; // Puede contener la factura, recibo, pagaré o movimiento guardado
}

