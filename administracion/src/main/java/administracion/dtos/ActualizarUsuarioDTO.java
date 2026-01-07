package administracion.dtos;

import lombok.Data;
import administracion.models.Rol;

@Data
public class ActualizarUsuarioDTO {
    private String nombre;
    private String email;
    private String telefono;
    private Rol rol;
    private Long empresaId;
}
