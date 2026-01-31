package notificacion.services;

import notificacion.models.NotificationConfig;
import notificacion.models.NotificationPreferences;
import notificacion.models.NotificationType;
import notificacion.repositories.NotificationPreferencesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class NotificationPreferencesService {

    private final NotificationPreferencesRepository repository;

    public NotificationPreferencesService(NotificationPreferencesRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Optional<NotificationPreferences> getPreferences(Long organizacionId, String usuarioId) {
        return repository.findByOrganizacionIdAndUsuarioId(organizacionId, usuarioId);
    }

    @Transactional
    public NotificationPreferences getOrCreatePreferences(Long organizacionId, String usuarioId) {
        return getPreferences(organizacionId, usuarioId)
                .orElseGet(() -> {
                    NotificationPreferences prefs = new NotificationPreferences();
                    prefs.setOrganizacionId(organizacionId);
                    prefs.setUsuarioId(usuarioId);
                    return repository.save(prefs);
                });
    }

    @Transactional
    public NotificationPreferences updatePreferences(Long organizacionId,
                                                     String usuarioId,
                                                     NotificationPreferences preferences) {
        NotificationPreferences existing = getOrCreatePreferences(organizacionId, usuarioId);

        existing.setEmailEnabled(preferences.isEmailEnabled());
        existing.setInAppEnabled(preferences.isInAppEnabled());
        existing.setPushEnabled(preferences.isPushEnabled());
        existing.setQuietStart(preferences.getQuietStart());
        existing.setQuietEnd(preferences.getQuietEnd());
        existing.setQuietDays(preferences.getQuietDays());
        existing.setDailyDigestEnabled(preferences.isDailyDigestEnabled());
        existing.setWeeklyDigestEnabled(preferences.isWeeklyDigestEnabled());
        existing.setDigestTime(preferences.getDigestTime());
        existing.setUserEmail(preferences.getUserEmail());

        if (preferences.getTypeConfigs() != null) {
            preferences.getTypeConfigs().forEach((type, config) -> {
                NotificationConfig target = existing.getTypeConfigs()
                        .computeIfAbsent(type, t -> new NotificationConfig());
                target.setEnabled(config.isEnabled());
                target.setEmailEnabled(config.isEmailEnabled());
                target.setInAppEnabled(config.isInAppEnabled());
                target.setMinSeverity(config.getMinSeverity());
                target.setMaxPerDay(config.getMaxPerDay());
            });
        }

        existing.setMovementHighThreshold(preferences.getMovementHighThreshold());
        existing.setMovementHighThresholdUsd(preferences.getMovementHighThresholdUsd());

        return repository.save(existing);
    }

    @Transactional
    public void updateTypePreference(Long organizacionId,
                                     String usuarioId,
                                     NotificationType type,
                                     boolean enabled,
                                     boolean emailEnabled,
                                     boolean inAppEnabled) {
        NotificationPreferences prefs = getOrCreatePreferences(organizacionId, usuarioId);
        NotificationConfig config = prefs.getTypeConfigs()
                .computeIfAbsent(type, t -> new NotificationConfig());
        config.setEnabled(enabled);
        config.setEmailEnabled(emailEnabled);
        config.setInAppEnabled(inAppEnabled);
        repository.save(prefs);
    }

    @Transactional(readOnly = true)
    public boolean isNotificationEnabled(Long organizacionId, String usuarioId, NotificationType type) {
        return getPreferences(organizacionId, usuarioId)
                .map(prefs -> prefs.isNotificationEnabled(type))
                .orElse(true);
    }

    @Transactional(readOnly = true)
    public boolean isEmailEnabled(Long organizacionId, String usuarioId, NotificationType type) {
        return getPreferences(organizacionId, usuarioId)
                .map(prefs -> prefs.isEmailEnabled(type))
                .orElse(true);
    }

    @Transactional(readOnly = true)
    public boolean isInAppEnabled(Long organizacionId, String usuarioId, NotificationType type) {
        return getPreferences(organizacionId, usuarioId)
                .map(prefs -> prefs.isInAppEnabled(type))
                .orElse(true);
    }

    @Transactional(readOnly = true)
    public boolean isInQuietHours(Long organizacionId, String usuarioId) {
        return getPreferences(organizacionId, usuarioId)
                .map(NotificationPreferences::isInQuietHours)
                .orElse(false);
    }
}
