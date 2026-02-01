package administracion.dtos;

import lombok.Data;

@Data
public class UsuarioDTO {
    private String sub;
    private String nombre;
    private String email;
    private String telefono;
    private String rol;
    private Long empresaId;
    private String empresaNombre;
    private String empresaCuit;
    private String empresaCondicionIVA;
    private String empresaDomicilio;
    private Boolean activo;
    private Boolean esPropietario;
}
