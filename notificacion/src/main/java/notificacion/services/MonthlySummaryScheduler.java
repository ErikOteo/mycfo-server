package notificacion.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import notificacion.dtos.ReportGeneratedEvent;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.Locale;

/**
 * Dispara una notificación "Resumen mensual listo" al inicio de cada mes
 * para todos los usuarios que tengan preferencias guardadas.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MonthlySummaryScheduler {

    private final EventService eventService;
    private final NotificationPreferencesService preferencesService;

    // Todos los meses, día 1 a las 06:00 AM hora del servidor
    @Scheduled(cron = "0 0 6 1 * *")
    public void sendMonthlySummary() {
        LocalDate now = LocalDate.now(ZoneId.systemDefault());
        LocalDate prevMonth = now.minusMonths(1);

        String periodLabel = prevMonth.getMonth()
                .getDisplayName(TextStyle.FULL, new Locale("es", "AR"))
                + " " + prevMonth.getYear();

        var tenants = preferencesService.listAllTenants();
        log.info("Enviando resumen mensual '{}' a {} tenants", periodLabel, tenants.size());

        tenants.forEach(t -> {
            try {
                ReportGeneratedEvent evt = new ReportGeneratedEvent(
                        t.getUsuarioId(),
                        "MONTHLY_SUMMARY",
                        "Resumen mensual listo",
                        periodLabel,
                        null,
                        Instant.now(),
                        false
                );
                eventService.handleReportGenerated(evt);
            } catch (Exception e) {
                log.error("No se pudo enviar resumen mensual a {} / {}: {}", t.getOrganizacionId(), t.getUsuarioId(), e.getMessage());
            }
        });
    }
}
