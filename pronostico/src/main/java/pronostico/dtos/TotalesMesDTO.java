package pronostico.dtos;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TotalesMesDTO {
  private String mes;                 // "YYYY-MM"
  private BigDecimal ingresoEstimado; // sum(INGRESO estimado)
  private BigDecimal egresoEstimado;  // sum(EGRESO estimado)
  private BigDecimal ingresoReal;     // sum(INGRESO real)
  private BigDecimal egresoReal;      // sum(EGRESO real)
}
