package pronostico.models;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "forecast_linea")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ForecastLinea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forecast_id", nullable = false)
    private Forecast forecast;

    @Column(name = "año", nullable = false)
    private Integer año;

    @Column(name = "mes", nullable = false)
    private Integer mes;

    @Column(name = "tipo", nullable = false, length = 20)
    @Builder.Default
    private String tipo = "estimado"; // "real" o "estimado"

    @Column(name = "ingresos_esperados", nullable = false, precision = 19, scale = 2)
    private BigDecimal ingresosEsperados;

    @Column(name = "egresos_esperados", nullable = false, precision = 19, scale = 2)
    private BigDecimal egresosEsperados;

    @Column(name = "balance_neto_esperado", nullable = false, precision = 19, scale = 2)
    private BigDecimal balanceNetoEsperado;
}

