package pronostico.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Getter
@Setter
public class PresupuestoDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con presupuesto
    @ManyToOne
    @JoinColumn(name = "presupuesto_id", nullable = false)
    private Presupuesto presupuesto;

    // Formato YYYY-MM
    @Column(length = 7, nullable = false)
    private String mes;

    private BigDecimal ingresoEstimado = BigDecimal.ZERO;
    private BigDecimal egresoEstimado = BigDecimal.ZERO;
    private BigDecimal ingresoReal = BigDecimal.ZERO;
    private BigDecimal egresoReal = BigDecimal.ZERO;

    @OneToMany(mappedBy = "presupuestoDetalle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PresupuestoMesCategoria> categorias;
}
