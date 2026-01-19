package registro.cargarDatos.dtos;

import lombok.Getter;
import lombok.Setter;
import registro.cargarDatos.models.TipoMovimiento;

@Getter
@Setter
public class CrearCategoriaRequest {
    private String nombre;
    private TipoMovimiento tipo; // opcional
}
