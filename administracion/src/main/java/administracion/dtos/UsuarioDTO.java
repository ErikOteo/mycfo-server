package administracion.dtos;

import lombok.Data;
import administracion.models.Rol;

@Data
public class UsuarioDTO {
    private String sub;
    private String nombre;
    private String email;
    private String telefono;
    private Rol rol;
    private Long empresaId;
    private String empresaNombre;
    private String empresaCuit;
    private String empresaCondicionIVA;
    private String empresaDomicilio;
    private Boolean activo;
}
