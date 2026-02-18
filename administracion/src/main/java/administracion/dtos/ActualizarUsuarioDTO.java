package administracion.dtos;

import lombok.Data;

@Data
public class ActualizarUsuarioDTO {
    private String nombre;
    private String email;
    private String telefono;
    private String rol;
    private Long empresaId;
    private Boolean esPropietario;
}
