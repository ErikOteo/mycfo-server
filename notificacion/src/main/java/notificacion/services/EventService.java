package notificacion.services;

import notificacion.dtos.*;
import notificacion.models.Notification;
import notificacion.models.NotificationType;
import notificacion.models.ResourceType;
import notificacion.models.Severity;
import notificacion.repositories.NotificationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import java.util.List;

@Service
public class EventService {

    private final NotificationRepository repo;
    private final NotificationService notificationService;
    private final AdministracionService administracionService;

    @Value("${notifications.default-user-id:demo-user}")
    private String defaultUsuarioId;

    @Value("${notifications.high-threshold:100000}")
    private BigDecimal highThreshold;

    public EventService(NotificationRepository repo,
                        NotificationService notificationService,
                        AdministracionService administracionService) {
        this.repo = repo;
        this.notificationService = notificationService;
        this.administracionService = administracionService;
    }

    @Transactional
    public void handleMovementCreated(MovementCreatedEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        String refId = Objects.requireNonNull(evt.refId(), "refId es obligatorio");
        Instant createdAt = evt.date() != null ? evt.date() : Instant.now();
        boolean isIncome = evt.amount() != null && evt.amount().signum() >= 0;

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx -> {
            saveIfNew(ctx, NotificationType.MOVEMENT_NEW, ResourceType.MOVEMENT, refId,
                    isIncome ? "Ingreso detectado" : "Egreso registrado",
                    formatMovementBody(evt),
                    Severity.INFO, createdAt);

            if (evt.amount() != null && evt.amount().abs().compareTo(highThreshold) >= 0) {
                saveIfNew(ctx, NotificationType.MOVEMENT_HIGH, ResourceType.MOVEMENT, refId,
                        "Movimiento alto detectado",
                        formatMovementBody(evt),
                        Severity.WARN, createdAt);
            }
        });
    }

    @Transactional
    public void handleBudgetCreated(BudgetCreatedEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Long budgetId = Objects.requireNonNull(evt.budgetId(), "budgetId es obligatorio");
        String budgetName = Objects.requireNonNull(evt.budgetName(), "budgetName es obligatorio");

        Instant now = Instant.now();
        forEachUserInEmpresa(baseCtx.organizacionId(), ctx -> {
            boolean recentDuplicate = repo.existsByOrganizacionIdAndUsuarioIdAndTypeAndResourceTypeAndResourceIdAndCreatedAtAfter(
                    ctx.organizacionId(),
                    ctx.usuarioId(),
                    NotificationType.BUDGET_CREATED,
                    ResourceType.BUDGET,
                    String.valueOf(budgetId),
                    now.minusSeconds(10)
            );
            if (recentDuplicate) {
                return;
            }

            Notification notification = buildBaseNotification(ctx);
            notification.setType(NotificationType.BUDGET_CREATED);
            notification.setTitle("Presupuesto creado");
            notification.setBody("Se creo el presupuesto %s%s".formatted(
                    budgetName,
                    (evt.period() != null && !evt.period().isBlank()) ? " (" + evt.period() + ")" : ""
            ));
            notification.setSeverity(Severity.INFO);
            notification.setResourceType(ResourceType.BUDGET);
            notification.setResourceId(String.valueOf(budgetId));
            notification.setActionUrl(
                    (evt.link() != null && !evt.link().isBlank())
                            ? evt.link()
                            : "/app/presupuestos/%d/detalle/actual".formatted(budgetId)
            );
            notification.setCreatedAt(now);

            notificationService.create(notification);
        });
    }

    @Transactional
    public void handleBudgetDeleted(BudgetDeletedEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Long budgetId = Objects.requireNonNull(evt.budgetId(), "budgetId es obligatorio");
        String budgetName = Objects.requireNonNull(evt.budgetName(), "budgetName es obligatorio");

        Instant now = Instant.now();
        forEachUserInEmpresa(baseCtx.organizacionId(), ctx -> {
            boolean recentDuplicate = repo.existsByOrganizacionIdAndUsuarioIdAndTypeAndResourceTypeAndResourceIdAndCreatedAtAfter(
                    ctx.organizacionId(),
                    ctx.usuarioId(),
                    NotificationType.BUDGET_DELETED,
                    ResourceType.BUDGET,
                    String.valueOf(budgetId),
                    now.minusSeconds(10)
            );
            if (recentDuplicate) {
                return;
            }

            Notification notification = buildBaseNotification(ctx);
            notification.setType(NotificationType.BUDGET_DELETED);
            notification.setTitle("Presupuesto eliminado");
            notification.setBody("Se elimino el presupuesto %s%s".formatted(
                    budgetName,
                    (evt.period() != null && !evt.period().isBlank()) ? " (" + evt.period() + ")" : ""
            ));
            notification.setSeverity(Severity.WARN);
            notification.setResourceType(ResourceType.BUDGET);
            notification.setResourceId(String.valueOf(budgetId));
            notification.setActionUrl(
                    (evt.link() != null && !evt.link().isBlank())
                            ? evt.link()
                            : "/app/presupuestos?tab=eliminados"
            );
            notification.setCreatedAt(now);

            notificationService.create(notification);
        });
    }

    @Transactional
    public void handleBudgetExceeded(BudgetExceededEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = evt.occurredAt() != null ? evt.occurredAt() : Instant.now();

        String title = "Presupuesto excedido: " + evt.budgetName();
        String body = String.format("Categoria: %s | Presupuestado: $%s | Real: $%s | Diferencia: $%s",
                evt.category(), evt.budgeted(), evt.actual(), evt.variance());

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        NotificationType.BUDGET_EXCEEDED,
                        ResourceType.BUDGET,
                        "budget_" + evt.budgetId() + "_" + evt.category(),
                        title,
                        body,
                        Severity.WARN,
                        createdAt));
    }

    @Transactional
    public void handleReportGenerated(ReportGeneratedEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = evt.generatedAt() != null ? evt.generatedAt() : Instant.now();

        String title = "Reporte generado: " + evt.reportName();
        String body = String.format("Tipo: %s | Periodo: %s", evt.reportType(), evt.period());

        NotificationType type = evt.hasAnomalies() ? NotificationType.REPORT_ANOMALY : NotificationType.REPORT_READY;
        Severity severity = evt.hasAnomalies() ? Severity.WARN : Severity.INFO;

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        type,
                        ResourceType.REPORT,
                        "report_" + evt.reportType() + "_" + evt.period(),
                        title,
                        body,
                        severity,
                        createdAt));
    }

    @Transactional
    public void handleCashFlowAlert(CashFlowAlertEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = evt.occurredAt() != null ? evt.occurredAt() : Instant.now();

        String title = "Alerta de Cash Flow";
        String body = evt.message() != null
                ? evt.message()
                : String.format("Balance actual: $%s | Balance pronosticado: $%s",
                evt.currentBalance(), evt.forecastBalance());

        Severity severity = "NEGATIVE".equals(evt.alertType()) ? Severity.CRIT : Severity.WARN;

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        NotificationType.CASH_FLOW_ALERT,
                        ResourceType.CASH_FLOW,
                        "cashflow_" + evt.alertType() + "_" + evt.period(),
                        title,
                        body,
                        severity,
                        createdAt));
    }

    @Transactional
    public void handleCustomReminder(CustomReminderEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = evt.scheduledFor() != null ? evt.scheduledFor() : Instant.now();

        NotificationType type = switch (evt.reminderType()) {
            case "DEADLINE" -> NotificationType.REMINDER_DEADLINE;
            case "DATA_LOAD" -> NotificationType.REMINDER_DATA_LOAD;
            case "BILL_DUE" -> NotificationType.REMINDER_BILL_DUE;
            default -> NotificationType.REMINDER_CUSTOM;
        };

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        type,
                        ResourceType.SYSTEM,
                        "reminder_" + evt.title().hashCode(),
                        evt.title(),
                        evt.message(),
                        Severity.INFO,
                        createdAt));
    }

    private String formatMovementBody(MovementCreatedEvent evt) {
        String desc = evt.description() != null && !evt.description().isBlank()
                ? evt.description() + " - "
                : "";
        return desc + "$" + (evt.amount() != null ? evt.amount() : "0");
    }

    private void saveIfNew(TenantContext ctx,
                           NotificationType type,
                           ResourceType resourceType,
                           String resourceId,
                           String title,
                           String body,
                           Severity severity,
                           Instant createdAt) {
        Instant start = createdAt.truncatedTo(ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.DAYS);

        boolean exists = repo.existsByOrganizacionIdAndUsuarioIdAndTypeAndResourceIdAndCreatedAtBetween(
                ctx.organizacionId(),
                ctx.usuarioId(),
                type,
                resourceId,
                start,
                end
        );
        if (exists) {
            return;
        }

        Notification notification = buildBaseNotification(ctx);
        notification.setType(type);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setSeverity(severity);
        notification.setResourceType(resourceType);
        notification.setResourceId(resourceId);
        notification.setCreatedAt(createdAt);

        repo.save(notification);
    }

    private Notification buildBaseNotification(TenantContext ctx) {
        Notification notification = new Notification();
        notification.setOrganizacionId(ctx.organizacionId());
        notification.setUsuarioId(ctx.usuarioId());
        notification.setRead(false);
        return notification;
    }

    private void forEachUserInEmpresa(Long organizacionId, java.util.function.Consumer<TenantContext> consumer) {
        List<UsuarioAdministracionDTO> usuarios = administracionService.obtenerUsuariosPorEmpresaId(organizacionId);
        if (usuarios == null || usuarios.isEmpty()) {
            return;
        }
        for (UsuarioAdministracionDTO usuario : usuarios) {
            if (usuario.getSub() == null || usuario.getSub().isBlank()) {
                continue;
            }
            TenantContext ctx = new TenantContext(organizacionId, usuario.getSub());
            consumer.accept(ctx);
        }
    }

    private TenantContext resolveTenant(String userIdFromEvent) {
        String usuarioId = userIdFromEvent != null ? userIdFromEvent : defaultUsuarioId;
        Long organizacionId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioId);
        return new TenantContext(organizacionId, usuarioId);
    }

    // Método sobrecargado para compatibilidad con eventos que usan Long userId
    private TenantContext resolveTenant(Long userIdFromEvent) {
        String usuarioId = userIdFromEvent != null ? userIdFromEvent.toString() : defaultUsuarioId;
        Long organizacionId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioId);
        return new TenantContext(organizacionId, usuarioId);
    }

    private record TenantContext(Long organizacionId, String usuarioId) {}
}
