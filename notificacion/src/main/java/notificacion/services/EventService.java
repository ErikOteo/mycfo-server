package notificacion.services;

import notificacion.dtos.*;
import notificacion.models.Notification;
import notificacion.models.NotificationPreferences;
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
    private final NotificationPreferencesService preferencesService;

    @Value("${notifications.default-user-id:demo-user}")
    private String defaultUsuarioId;

    @Value("${notifications.high-threshold:100000}")
    private BigDecimal highThreshold;

    @Value("${notifications.high-threshold-usd:1000}")
    private BigDecimal highThresholdUsd;

    public EventService(NotificationRepository repo,
                        NotificationService notificationService,
                        AdministracionService administracionService,
                        NotificationPreferencesService preferencesService) {
        this.repo = repo;
        this.notificationService = notificationService;
        this.administracionService = administracionService;
        this.preferencesService = preferencesService;
    }

    @Transactional
    public void handleMovementCreated(MovementCreatedEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        String refId = Objects.requireNonNull(evt.refId(), "refId es obligatorio");
        Instant createdAt = evt.date() != null ? evt.date() : Instant.now();
        boolean isIncome = evt.amount() != null && evt.amount().signum() >= 0;

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx -> {
            BigDecimal threshold = preferencesService
                    .getPreferences(ctx.organizacionId(), ctx.usuarioId())
                    .map(NotificationPreferences::getMovementHighThreshold)
                    .orElse(highThreshold);
            BigDecimal thresholdUsd = preferencesService
                    .getPreferences(ctx.organizacionId(), ctx.usuarioId())
                    .map(NotificationPreferences::getMovementHighThresholdUsd)
                    .orElse(highThresholdUsd);

            String currency = evt.currency() != null ? evt.currency().toUpperCase() : "ARS";
            BigDecimal selectedThreshold = switch (currency) {
                case "USD", "USDT", "DOL", "DOLAR" -> thresholdUsd != null ? thresholdUsd : threshold;
                default -> threshold;
            };

            if (evt.amount() != null && evt.amount().signum() > 0 &&
                    selectedThreshold != null &&
                    evt.amount().abs().compareTo(selectedThreshold) >= 0) {
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

        boolean isMonthly = "MONTHLY_SUMMARY".equalsIgnoreCase(evt.reportType());
        NotificationType type = isMonthly
                ? NotificationType.MONTHLY_SUMMARY
                : (evt.hasAnomalies() ? NotificationType.REPORT_ANOMALY : NotificationType.REPORT_READY);
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
    public void handleReportAnomaly(ReportGeneratedEvent evt) {
        ReportGeneratedEvent anomalyEvt = new ReportGeneratedEvent(
                evt.userId(),
                evt.reportType(),
                evt.reportName(),
                evt.period(),
                evt.downloadUrl(),
                evt.generatedAt(),
                true
        );
        handleReportGenerated(anomalyEvt);
    }

    @Transactional
    public void handleBudgetWarning(BudgetWarningEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = evt.occurredAt() != null ? evt.occurredAt() : Instant.now();

        String title = "Presupuesto al " + evt.executedPercent() + "%: " + evt.budgetName();
        String body = "Categoria: %s | Presupuestado: $%s | Ejecutado: $%s".formatted(
                evt.category() != null ? evt.category() : "General",
                evt.budgeted(),
                evt.actual()
        );

        String resourceId = "budget_" + evt.budgetId() + "_" + (evt.category() != null ? evt.category() : "general");

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        NotificationType.BUDGET_WARNING,
                        ResourceType.BUDGET,
                        resourceId,
                        title,
                        body,
                        Severity.INFO,
                        createdAt));
    }

    @Transactional
    public void handleBudgetMissingCategory(BudgetMissingCategoryEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = evt.occurredAt() != null ? evt.occurredAt() : Instant.now();

        String title = "Categoría sin presupuesto: " + evt.category();
        String body = "No hay presupuesto asignado para %s en %s".formatted(
                evt.category(),
                evt.period() != null ? evt.period() : "el período actual"
        );

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        NotificationType.BUDGET_MISSING_CATEGORY,
                        ResourceType.BUDGET,
                        "budget_missing_" + evt.category(),
                        title,
                        body,
                        Severity.WARN,
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
    public void handleReminderDeadline(ReminderDeadlineEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = evt.dueDate() != null ? evt.dueDate().minus(1, ChronoUnit.DAYS) : Instant.now();

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        NotificationType.REMINDER_DEADLINE,
                        ResourceType.SYSTEM,
                        "reminder_deadline_" + evt.title().hashCode(),
                        "Recordatorio próximo a vencer",
                        String.format("%s - %s", defaultString(evt.title(), "Recordatorio"), defaultString(evt.message(), "")),
                        Severity.INFO,
                        createdAt));
    }

    @Transactional
    public void handleReminderCreated(ReminderCreatedEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = evt.scheduledFor() != null ? evt.scheduledFor() : Instant.now();

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        NotificationType.REMINDER_CREATED,
                        ResourceType.SYSTEM,
                        "reminder_created_" + evt.title().hashCode(),
                        "Nuevo recordatorio creado",
                        String.format("%s - %s | Para: %s", defaultString(evt.title(), ""), defaultString(evt.message(), ""), createdAt),
                        Severity.INFO,
                        createdAt));
    }

    @Transactional
    public void handleForecastReminder(ForecastReminderEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = Instant.now();

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        NotificationType.FORECAST_REMINDER,
                        ResourceType.SYSTEM,
                        "forecast_" + defaultString(evt.periodLabel(), "periodo"),
                        "No olvides generar tus pronósticos",
                        String.format("Período: %s", defaultString(evt.periodLabel(), "Actual")),
                        Severity.INFO,
                        createdAt));
    }

    @Transactional
    public void handleConciliationReminder(ConciliationReminderEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = Instant.now();

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        NotificationType.CONCILIATION_REMINDER,
                        ResourceType.MOVEMENT,
                        "conciliation_reminder_" + defaultString(evt.accountName(), "general"),
                        "Recordatorio de conciliación",
                        String.format("Cuenta: %s | Días pendientes: %d",
                                defaultString(evt.accountName(), "-"),
                                evt.pendingDays()),
                        Severity.INFO,
                        createdAt));
    }

    @Transactional
    public void handleBillDue(BillDueEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = evt.dueDate() != null ? evt.dueDate() : Instant.now();

        String title = "Factura por vencer: " + (evt.billNumber() != null ? evt.billNumber() : evt.billId());
        String body = "Monto: $%s | Vence en %s días".formatted(
                evt.amount() != null ? evt.amount() : "0",
                evt.daysUntilDue() != null ? evt.daysUntilDue() : "?"
        );

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx -> {
            Notification notification = buildBaseNotification(ctx);
            notification.setType(NotificationType.REMINDER_BILL_DUE);
            notification.setTitle(title);
            notification.setBody(body);
            notification.setSeverity(Severity.WARN);
            notification.setResourceType(ResourceType.BILL);
            notification.setResourceId(evt.billId() != null ? evt.billId().toString() : "bill_due");
            notification.setActionUrl(evt.link());
            notification.setCreatedAt(createdAt);
            notificationService.create(notification);
        });
    }

    @Transactional
    public void handleMovementsImported(MovementImportEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = evt.importedAt() != null ? evt.importedAt() : Instant.now();

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        NotificationType.MOVEMENT_IMPORT,
                        ResourceType.MOVEMENT,
                        evt.importId() != null ? evt.importId() : "import",
                        "Importación de movimientos",
                        String.format("Fuente: %s | Registros: %d",
                                defaultString(evt.sourceName(), "Excel"),
                                evt.totalRows()),
                        Severity.INFO,
                        createdAt));
    }

    @Transactional
    public void handleMovementDuplicate(MovementDuplicateEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = evt.occurredAt() != null ? evt.occurredAt() : Instant.now();

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        NotificationType.MOVEMENT_DUPLICATE,
                        ResourceType.MOVEMENT,
                        evt.refId(),
                        "Movimiento duplicado detectado",
                        String.format("Descripción: %s | Cuenta: %s | Duplica: %s",
                                defaultString(evt.description(), "-"),
                                defaultString(evt.accountName(), "-"),
                                defaultString(evt.duplicateOfRef(), "-")),
                        Severity.WARN,
                        createdAt));
    }

    @Transactional
    public void handleMpLinked(AccountMpLinkedEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = Instant.now();

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        NotificationType.ACCOUNT_MP_LINKED,
                        ResourceType.SYSTEM,
                        evt.accountId() != null ? evt.accountId().toString() : "mp_link",
                        "Cuenta vinculada a Mercado Pago",
                        String.format("Cuenta: %s", defaultString(evt.accountName(), "-")),
                        Severity.INFO,
                        createdAt));
    }

    @Transactional
    public void handleReconciliationStale(ReconciliationStaleEvent evt) {
        TenantContext baseCtx = resolveTenant(evt.userId());
        Instant createdAt = evt.asOf() != null ? evt.asOf() : Instant.now();

        String title = "Conciliación pendiente hace %s días".formatted(evt.daysStale());
        String body = "Cuenta: %s | Pendientes: %d".formatted(
                evt.accountName() != null ? evt.accountName() : "sin nombre",
                evt.pendingCount()
        );

        forEachUserInEmpresa(baseCtx.organizacionId(), ctx ->
                saveIfNew(ctx,
                        NotificationType.RECONCILIATION_STALE,
                        ResourceType.MOVEMENT,
                        "recon_" + (evt.accountId() != null ? evt.accountId() : "default"),
                        title,
                        body,
                        Severity.WARN,
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
        String currency = evt.currency() != null ? evt.currency().toUpperCase() : "ARS";
        String symbol = "USD".equals(currency) ? "US$" : "$";
        return desc + symbol + (evt.amount() != null ? evt.amount() : "0");
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

        // Usamos el servicio para que aplique validaciones y envíe email si corresponde
        notificationService.create(notification);
    }

    private Notification buildBaseNotification(TenantContext ctx) {
        Notification notification = new Notification();
        notification.setOrganizacionId(ctx.organizacionId());
        notification.setUsuarioId(ctx.usuarioId());
        notification.setRead(false);
        return notification;
    }

    private String defaultString(String value, String defaultVal) {
        return (value == null || value.isBlank()) ? defaultVal : value;
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
