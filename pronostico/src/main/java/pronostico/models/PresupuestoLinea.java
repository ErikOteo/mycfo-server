package pronostico.models;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
    name = "presupuesto_linea",
    indexes = {
        @Index(name="idx_linea_presupuesto", columnList = "presupuesto_id"),
        @Index(name="idx_linea_presupuesto_mes", columnList = "presupuesto_id, mes")
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PresupuestoLinea {

    public enum Tipo { INGRESO, EGRESO }
    public enum SourceType { MANUAL, AUTOMATICO }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional=false, fetch = FetchType.LAZY)
    @JoinColumn(name = "presupuesto_id", nullable = false)
    private Presupuesto presupuesto;

    /** Mes en formato YYYY-MM */
    @Column(nullable=false, length=10)
    private String mes;

    @Column(nullable=false)
    private String categoria;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=10)
    private Tipo tipo;

    @Builder.Default
    @Column(name="monto_estimado", precision=19, scale=2)
    private BigDecimal montoEstimado = BigDecimal.ZERO;

    @Column(name="monto_real", precision=19, scale=2)
    private BigDecimal montoReal;

    @Enumerated(EnumType.STRING)
    @Column(name="source_type", nullable=false, length=15)
    @Builder.Default
    private SourceType sourceType = SourceType.MANUAL;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private java.time.LocalDateTime updatedAt;
}

