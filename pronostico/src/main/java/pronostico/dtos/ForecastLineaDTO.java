package pronostico.dtos;

import lombok.*;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastLineaDTO {
    
    private Long id;
    
    private Integer año;
    
    private Integer mes;
    
    private String tipo; // "real" o "estimado"
    
    private BigDecimal ingresosEsperados;
    
    private BigDecimal egresosEsperados;
    
    private BigDecimal balanceNetoEsperado;
}

