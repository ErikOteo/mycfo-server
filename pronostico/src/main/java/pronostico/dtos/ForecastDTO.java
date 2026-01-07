package pronostico.dtos;

import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastDTO {
    
    private Long id;
    
    private Long organizacionId;
    
    private Long forecastConfigId;
    
    private String nombre;
    
    private Integer mesesFrecuencia;
    
    private Integer horizonteMeses;
    
    private Integer periodosAnalizados;
    
    private String mesInicioPronostico;
    
    private String mesFinPronostico;
    
    private String creadoPor;
    
    private String createdAt;
    
    private boolean eliminado;
    
    private List<ForecastLineaDTO> lineas;
}

