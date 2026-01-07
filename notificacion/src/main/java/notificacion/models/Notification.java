package notificacion.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notif_org_user_read", columnList = "organizacion_id,usuario_id,is_read"),
        @Index(name = "idx_notif_org_user_created", columnList = "organizacion_id,usuario_id,created_at")
})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    @Setter
    private Long id;

    @Column(name = "usuario_id", nullable = false, length = 64)
    @Getter
    @Setter
    private String usuarioId;

    @Column(name = "organizacion_id", nullable = false)
    @Getter
    @Setter
    private Long organizacionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 40)
    @Getter
    @Setter
    private NotificationType type;

    @Column(name = "title", nullable = false, length = 200)
    @Getter
    @Setter
    private String title;

    @Column(name = "body", length = 500)
    @Getter
    @Setter
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 10)
    @Getter
    @Setter
    private Severity severity = Severity.INFO;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", length = 30)
    @Getter
    @Setter
    private ResourceType resourceType;

    @Column(name = "resource_id", length = 64)
    @Getter
    @Setter
    private String resourceId;

    @Column(name = "action_url", length = 255)
    @Getter
    @Setter
    private String actionUrl;

    @Column(name = "is_read", nullable = false)
    @Getter
    @Setter
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Getter
    @Setter
    private Instant createdAt = Instant.now();



    // getters & setters
    // (si usás Lombok, reemplazá por @Getter @Setter)
    // ...
}
