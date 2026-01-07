package pronostico.dtos;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastListDTO {
    
    private Long id;
    
    private String nombre;
    
    private Integer mesesFrecuencia;
    
    private Integer horizonteMeses;
    
    private String createdAt;
    
    private String creadoPor;
}

