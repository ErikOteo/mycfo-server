package pronostico.dtos;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineaDTO {
  private Long id;
  private String categoria;
  private String tipo;           // "INGRESO" | "EGRESO"
  private BigDecimal montoEstimado;
  private BigDecimal montoReal;  // puede ser null
}
