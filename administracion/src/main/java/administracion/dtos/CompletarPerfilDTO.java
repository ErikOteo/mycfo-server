package administracion.dtos;

import lombok.Data;

@Data
public class CompletarPerfilDTO {
    private String sub; // Se obtiene del token después del login
    private String nombre;
    private String email;
    private String telefono;
    private String nombreEmpresa;
    private String descripcionEmpresa;
}

