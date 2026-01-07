package notificacion.services;

import notificacion.models.Notification;
import notificacion.models.NotificationPreferences;
import notificacion.repositories.NotificationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class NotificationDigestService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferencesService preferencesService;
    private final EmailNotificationService emailService;

    public NotificationDigestService(NotificationRepository notificationRepository,
                                     NotificationPreferencesService preferencesService,
                                     EmailNotificationService emailService) {
        this.notificationRepository = notificationRepository;
        this.preferencesService = preferencesService;
        this.emailService = emailService;
    }

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void checkAndSendDailyDigests() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        Instant startOfDay = yesterday.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfDay = yesterday.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<NotificationRepository.TenantScope> tenants =
                notificationRepository.findDistinctTenantScopeByCreatedAtBetween(startOfDay, endOfDay);

        for (NotificationRepository.TenantScope tenant : tenants) {
            NotificationPreferences prefs = preferencesService
                    .getPreferences(tenant.getOrganizacionId(), tenant.getUsuarioId())
                    .orElse(null);
            if (prefs == null || !prefs.isDailyDigestEnabled()) {
                continue;
            }

            LocalTime currentTime = LocalTime.now();
            LocalTime digestTime = prefs.getDigestTime();

            if (digestTime == null ||
                currentTime.getHour() != digestTime.getHour() ||
                currentTime.getMinute() != digestTime.getMinute()) {
                continue;
            }

            List<Notification> notifications = notificationRepository
                    .findByOrganizacionIdAndUsuarioIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                            tenant.getOrganizacionId(),
                            tenant.getUsuarioId(),
                            startOfDay,
                            endOfDay
                    );

            if (!notifications.isEmpty()) {
                emailService.sendDailyDigest(tenant.getOrganizacionId(), tenant.getUsuarioId(), notifications);
            }
        }

        checkAndSendWeeklyDigests();
    }

    @Transactional
    public void checkAndSendWeeklyDigests() {
        if (LocalDate.now().getDayOfWeek() != java.time.DayOfWeek.MONDAY) {
            return;
        }

        LocalDate weekAgo = LocalDate.now().minusWeeks(1);
        Instant startOfWeek = weekAgo.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfWeek = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<NotificationRepository.TenantScope> tenants =
                notificationRepository.findDistinctTenantScopeByCreatedAtBetween(startOfWeek, endOfWeek);

        for (NotificationRepository.TenantScope tenant : tenants) {
            NotificationPreferences prefs = preferencesService
                    .getPreferences(tenant.getOrganizacionId(), tenant.getUsuarioId())
                    .orElse(null);
            if (prefs == null || !prefs.isWeeklyDigestEnabled()) {
                continue;
            }

            LocalTime currentTime = LocalTime.now();
            LocalTime digestTime = prefs.getDigestTime();

            if (digestTime == null ||
                currentTime.getHour() != digestTime.getHour() ||
                currentTime.getMinute() != digestTime.getMinute()) {
                continue;
            }

            List<Notification> notifications = notificationRepository
                    .findByOrganizacionIdAndUsuarioIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                            tenant.getOrganizacionId(),
                            tenant.getUsuarioId(),
                            startOfWeek,
                            endOfWeek
                    );

            if (!notifications.isEmpty()) {
                emailService.sendWeeklyDigest(tenant.getOrganizacionId(), tenant.getUsuarioId(), notifications);
            }
        }
    }
}
