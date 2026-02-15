package administracion.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "solicitudes_acceso")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SolicitudAcceso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_sub", nullable = false)
    private String usuarioSub; // Sub del usuario solicitante

    @Column(name = "usuario_nombre")
    private String usuarioNombre; // Nombre para mostrar

    @Column(name = "usuario_email")
    private String usuarioEmail; // Email para contacto/notificación

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoSolicitud estado; // PENDIENTE, APROBADA, RECHAZADA

    private LocalDateTime fechaSolicitud;

    private LocalDateTime fechaResolucion;

    @PrePersist
    protected void onCreate() {
        fechaSolicitud = LocalDateTime.now();
        if (estado == null) {
            estado = EstadoSolicitud.PENDIENTE;
        }
    }

    public enum EstadoSolicitud {
        PENDIENTE,
        APROBADA,
        RECHAZADA
    }

    @com.fasterxml.jackson.annotation.JsonProperty("nombreEmpresa")
    public String getNombreEmpresa() {
        return empresa != null ? empresa.getNombre() : null;
    }
}
