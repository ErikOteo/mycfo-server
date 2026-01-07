package notificacion.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Entity
@Table(
    name = "notification_preferences",
    uniqueConstraints = @UniqueConstraint(
            name = "uk_notif_pref_org_user",
            columnNames = {"organizacion_id", "usuario_id"}
    )
)
@Getter
@Setter
public class NotificationPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organizacion_id", nullable = false)
    private Long organizacionId;

    @Column(name = "usuario_id", nullable = false, length = 64)
    private String usuarioId;

    // Preferencias generales
    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = true;

    @Column(name = "in_app_enabled", nullable = false)
    private boolean inAppEnabled = true;

    @Column(name = "push_enabled", nullable = false)
    private boolean pushEnabled = false;

    // Horarios de silencio
    @Column(name = "quiet_start")
    private LocalTime quietStart;

    @Column(name = "quiet_end")
    private LocalTime quietEnd;

    @ElementCollection
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "notification_quiet_days", joinColumns = @JoinColumn(name = "preference_id"))
    @Column(name = "day_of_week")
    private Set<DayOfWeek> quietDays = new HashSet<>();

    // Configuración por tipo de notificación
    @ElementCollection
    @CollectionTable(name = "notification_type_configs", joinColumns = @JoinColumn(name = "preference_id"))
    @MapKeyEnumerated(EnumType.STRING)
    @MapKeyColumn(name = "notification_type")
    private Map<NotificationType, NotificationConfig> typeConfigs = new HashMap<>();

    // Configuración de digest
    @Column(name = "daily_digest_enabled", nullable = false)
    private boolean dailyDigestEnabled = true;

    @Column(name = "weekly_digest_enabled", nullable = false)
    private boolean weeklyDigestEnabled = false;

    @Column(name = "digest_time")
    private LocalTime digestTime = LocalTime.of(9, 0); // 9:00 AM por defecto

    // Email del usuario (configurable)
    @Column(name = "user_email")
    private String userEmail;

    // Constructor por defecto
    public NotificationPreferences() {
        // Inicializar configuraciones por defecto para cada tipo
        for (NotificationType type : NotificationType.values()) {
            NotificationConfig config = new NotificationConfig();
            config.setEnabled(true);
            config.setEmailEnabled(true);
            config.setInAppEnabled(true);
            config.setMinSeverity(Severity.INFO);
            config.setMaxPerDay(50);
            typeConfigs.put(type, config);
        }
    }

    // Métodos de conveniencia
    public boolean isNotificationEnabled(NotificationType type) {
        return typeConfigs.getOrDefault(type, new NotificationConfig()).isEnabled();
    }

    public boolean isEmailEnabled(NotificationType type) {
        return emailEnabled && typeConfigs.getOrDefault(type, new NotificationConfig()).isEmailEnabled();
    }

    public boolean isInAppEnabled(NotificationType type) {
        return inAppEnabled && typeConfigs.getOrDefault(type, new NotificationConfig()).isInAppEnabled();
    }

    public boolean isInQuietHours() {
        if (quietStart == null || quietEnd == null) {
            return false;
        }
        
        LocalTime now = LocalTime.now();
        DayOfWeek today = java.time.LocalDate.now().getDayOfWeek();
        
        // Verificar si hoy es un día de silencio
        if (quietDays.contains(today)) {
            return true;
        }
        
        // Verificar si estamos en horario de silencio
        if (quietStart.isBefore(quietEnd)) {
            return now.isAfter(quietStart) && now.isBefore(quietEnd);
        } else {
            // Horario que cruza medianoche
            return now.isAfter(quietStart) || now.isBefore(quietEnd);
        }
    }
}
