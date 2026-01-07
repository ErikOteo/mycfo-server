package notificacion.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Embeddable
@Getter
@Setter
public class NotificationConfig {

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = true;

    @Column(name = "in_app_enabled", nullable = false)
    private boolean inAppEnabled = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "min_severity", nullable = false)
    private Severity minSeverity = Severity.INFO;

    @Column(name = "max_per_day", nullable = false)
    private int maxPerDay = 50;

    // Constructor por defecto
    public NotificationConfig() {
    }

    // Constructor con parámetros
    public NotificationConfig(boolean enabled, boolean emailEnabled, boolean inAppEnabled, 
                            Severity minSeverity, int maxPerDay) {
        this.enabled = enabled;
        this.emailEnabled = emailEnabled;
        this.inAppEnabled = inAppEnabled;
        this.minSeverity = minSeverity;
        this.maxPerDay = maxPerDay;
    }
}
