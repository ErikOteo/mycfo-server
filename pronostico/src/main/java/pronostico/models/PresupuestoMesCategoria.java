package pronostico.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
public class PresupuestoMesCategoria {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "presupuesto_detalle_id", nullable = false)
  private PresupuestoDetalle presupuestoDetalle;

  private String categoria;

  @Enumerated(EnumType.STRING)
  @Column(length = 10)
  private TipoMovimiento tipo; // INGRESO o EGRESO

  private BigDecimal montoEstimado = BigDecimal.ZERO;
  private BigDecimal montoReal;

  public enum TipoMovimiento {
    INGRESO, EGRESO
  }
}
