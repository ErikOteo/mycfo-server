package pronostico.dtos;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CrearLineaRequest {
  private String categoria;           // ej: "Alquiler"
  private String tipo;                // "INGRESO" | "EGRESO" (case-insensitive)
  private BigDecimal montoEstimado;   // requerido
  private BigDecimal montoReal;       // opcional (puede venir null)
}


