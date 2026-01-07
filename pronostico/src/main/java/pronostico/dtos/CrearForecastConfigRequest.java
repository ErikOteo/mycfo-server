package pronostico.dtos;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrearForecastConfigRequest {
    
    private String nombre;
    
    private Integer mesesFrecuencia; // Cada cuántos meses se genera (ej: 6 = cada 6 meses)
    
    private Integer horizonteMeses; // Cuántos meses de pronóstico se generan
}

