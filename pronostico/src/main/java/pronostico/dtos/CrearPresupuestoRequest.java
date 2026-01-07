package pronostico.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrearPresupuestoRequest {

  @JsonProperty("nombre")
  private String nombre;

  @JsonProperty("desde")
  private String desde; // formato YYYY-MM

  @JsonProperty("hasta")
  private String hasta; // formato YYYY-MM

  @JsonProperty("autogenerarCeros")
  private boolean autogenerarCeros;

  @JsonProperty("plantilla")
  private List<PlantillaLinea> plantilla;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class PlantillaLinea {
    @JsonProperty("categoria")
    private String categoria;

    /** Debe llegar "INGRESO" o "EGRESO" */
    @JsonProperty("tipo")
    private String tipo;

    @JsonProperty("montoEstimado")
    private BigDecimal montoEstimado;

    @JsonProperty("montoReal")
    private BigDecimal montoReal;

    @JsonProperty("meses")
    private List<PlantillaMes> meses;

    /** Porcentaje mensual constante para aplicar composición cuando no hay desglose. */
    @JsonProperty("porcentajeMensual")
    @JsonAlias({"porcentaje", "porcentajeAjusteMensual", "variacionMensual"})
    private BigDecimal porcentajeMensual;
  }

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class PlantillaMes {
    @JsonProperty("mes")
    private String mes;

    @JsonProperty("montoEstimado")
    private BigDecimal montoEstimado;

    @JsonProperty("montoReal")
    private BigDecimal montoReal;
  }
}

