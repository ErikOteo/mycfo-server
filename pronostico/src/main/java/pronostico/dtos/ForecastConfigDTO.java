package pronostico.dtos;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastConfigDTO {
    
    private Long id;
    
    private Long organizacionId;
    
    private String nombre;
    
    private Integer mesesFrecuencia;
    
    private Integer horizonteMeses;
    
    private String creadoPor;
    
    private String createdAt;
    
    private String updatedAt;
    
    private boolean activo;
}

