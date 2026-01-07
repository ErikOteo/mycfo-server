package administracion.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizacionInfoResponse {

    private UsuarioDTO perfil;

    private EmpresaDTO empresa;

    private List<UsuarioDTO> empleados;
}
