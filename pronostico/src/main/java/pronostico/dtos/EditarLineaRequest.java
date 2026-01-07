package pronostico.dtos;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class EditarLineaRequest {
  private String categoria;           // opcional
  private String tipo;                // opcional ("INGRESO"/"EGRESO")
  private BigDecimal montoEstimado;   // opcional
  private BigDecimal montoReal;       // opcional
}
