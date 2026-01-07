package pronostico.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "presupuesto",
        uniqueConstraints = {
            @UniqueConstraint(
                    name = "uk_presupuesto_organizacion_nombre_periodo",
                    columnNames = {"organizacion_id", "nombre", "desde", "hasta"}
            )
        },
        indexes = {
            @Index(name = "idx_presupuesto_organizacion_id", columnList = "organizacion_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Presupuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organizacion_id")
    private Long organizacionId;

    @Column(name = "owner_sub", nullable = false, length = 64)
    private String ownerSub;

    @Column(nullable=false)
    private String nombre;

    @Column(nullable=false, length=10)
    private String desde;

    @Column(nullable=false, length=10)
    private String hasta;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by", length = 64)
    private String deletedBy;
}
