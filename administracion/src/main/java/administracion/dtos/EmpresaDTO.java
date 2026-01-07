package administracion.dtos;

import lombok.Data;

@Data
public class EmpresaDTO {
    private Long id;
    private String nombre;
    private String descripcion;
    private String cuit;
    private String condicionIVA;
    private String domicilio;
}
