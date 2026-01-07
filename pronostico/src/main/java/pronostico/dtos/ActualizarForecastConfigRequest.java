package pronostico.dtos;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActualizarForecastConfigRequest {
    
    private String nombre;
    
    private Integer mesesFrecuencia; // Cada cuántos meses se genera
    
    private Integer horizonteMeses; // Cuántos meses de pronóstico se generan
    
    private Boolean activo;
}

