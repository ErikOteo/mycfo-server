package pronostico.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "forecast")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Forecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organizacion_id", nullable = false)
    private Long organizacionId;

    @Column(name = "forecast_config_id", nullable = true)
    private Long forecastConfigId; // Referencia a la configuración que lo generó (opcional)

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "meses_frecuencia", nullable = false)
    private Integer mesesFrecuencia; // Frecuencia usada para generar este forecast

    @Column(name = "horizonte_meses", nullable = false)
    private Integer horizonteMeses; // Horizonte del pronóstico

    @Column(name = "periodos_analizados", nullable = false)
    private Integer periodosAnalizados; // Cuántos periodos históricos se analizaron

    @Column(name = "mes_inicio_pronostico", nullable = false, length = 10)
    private String mesInicioPronostico; // Mes desde donde empieza el pronóstico (YYYY-MM)

    @Column(name = "mes_fin_pronostico", nullable = false, length = 10)
    private String mesFinPronostico; // Mes hasta donde llega el pronóstico (YYYY-MM)

    @Column(name = "creado_por", nullable = false, length = 64)
    private String creadoPor; // Sub del usuario o "SISTEMA" si es automático

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean eliminado = false;

    @Column(name = "eliminado_at")
    private LocalDateTime eliminadoAt;

    @Column(name = "eliminado_por", length = 64)
    private String eliminadoPor;
}

