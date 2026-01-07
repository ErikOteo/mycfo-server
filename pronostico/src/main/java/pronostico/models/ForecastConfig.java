package pronostico.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "forecast_config")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ForecastConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organizacion_id", nullable = false)
    private Long organizacionId;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "meses_frecuencia", nullable = false)
    private Integer mesesFrecuencia; // Cada cuántos meses se genera (ej: 6 = cada 6 meses)

    @Column(name = "horizonte_meses", nullable = false)
    private Integer horizonteMeses; // Cuántos meses de pronóstico se generan

    @Column(name = "creado_por", nullable = false, length = 64)
    private String creadoPor; // Sub del usuario que creó la configuración

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean activo = true;
}

