package notificacion.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "custom_reminders", indexes = {
    @Index(name = "idx_reminder_org_user", columnList = "organizacion_id,usuario_id"),
    @Index(name = "idx_reminder_scheduled", columnList = "scheduled_for"),
    @Index(name = "idx_reminder_active", columnList = "is_active")
})
@Getter
@Setter
public class CustomReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false, length = 64)
    private String usuarioId;

    @Column(name = "organizacion_id", nullable = false)
    private Long organizacionId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "scheduled_for", nullable = false)
    private Instant scheduledFor;

    @Column(name = "is_recurring", nullable = false)
    private boolean isRecurring = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_pattern", length = 20)
    private RecurrencePattern recurrencePattern;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "last_triggered")
    private Instant lastTriggered;

    @Column(name = "next_trigger")
    private Instant nextTrigger;

    // Enums para patrones de recurrencia
    public enum RecurrencePattern {
        DAILY,      // Diario
        WEEKLY,     // Semanal
        MONTHLY,    // Mensual
        YEARLY      // Anual
    }

    // Constructor por defecto
    public CustomReminder() {
    }

    // Constructor con parámetros básicos
    public CustomReminder(String usuarioId, Long organizacionId, String title, String message, Instant scheduledFor) {
        this.usuarioId = usuarioId;
        this.organizacionId = organizacionId;
        this.title = title;
        this.message = message;
        this.scheduledFor = scheduledFor;
    }

    // Método para calcular el próximo trigger
    public void calculateNextTrigger() {
        if (!isRecurring || recurrencePattern == null) {
            this.nextTrigger = null;
            return;
        }

        // Para la primera vez, usar scheduledFor como base
        // Para las siguientes veces, usar lastTriggered como base
        Instant base = lastTriggered != null ? lastTriggered : scheduledFor;
        
        switch (recurrencePattern) {
            case DAILY:
                this.nextTrigger = base.plusSeconds(24 * 60 * 60); // 24 horas
                break;
            case WEEKLY:
                this.nextTrigger = base.plusSeconds(7 * 24 * 60 * 60); // 7 días
                break;
            case MONTHLY:
                this.nextTrigger = base.plusSeconds(30L * 24 * 60 * 60); // 30 días
                break;
            case YEARLY:
                this.nextTrigger = base.plusSeconds(365L * 24 * 60 * 60); // 365 días
                break;
        }
    }
    
    // Método para inicializar el próximo trigger (primera vez)
    public void initializeNextTrigger() {
        if (!isRecurring || recurrencePattern == null) {
            this.nextTrigger = null;
            return;
        }
        
        // Para recordatorios recurrentes, la primera ejecución es en scheduledFor
        this.nextTrigger = this.scheduledFor;
    }

    // Método para marcar como ejecutado
    public void markAsTriggered() {
        this.lastTriggered = Instant.now();
        calculateNextTrigger();
    }
}
