package notificacion.controllers;

import notificacion.models.NotificationPreferences;
import notificacion.models.NotificationType;
import notificacion.services.AdministracionService;
import notificacion.services.NotificationPreferencesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users/{userId}/notification-preferences")
public class NotificationPreferencesController {

    private final NotificationPreferencesService preferencesService;
    private final AdministracionService administracionService;

    public NotificationPreferencesController(NotificationPreferencesService preferencesService,
                                             AdministracionService administracionService) {
        this.preferencesService = preferencesService;
        this.administracionService = administracionService;
    }

    private String resolveUsuarioSub(String pathUserId, String headerUsuarioSub) {
        return (headerUsuarioSub != null && !headerUsuarioSub.isBlank())
                ? headerUsuarioSub
                : pathUserId;
    }

    @GetMapping
    public ResponseEntity<NotificationPreferences> getPreferences(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub) {
        String currentSub = resolveUsuarioSub(userId, usuarioSub);
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(currentSub);
        // Siempre devolver preferencias: si no existen, se crean con valores por defecto
        NotificationPreferences prefs = preferencesService.getOrCreatePreferences(empresaId, currentSub);
        return ResponseEntity.ok(prefs);
    }

    @PutMapping
    public ResponseEntity<NotificationPreferences> updatePreferences(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestBody NotificationPreferences preferences) {
        String currentSub = resolveUsuarioSub(userId, usuarioSub);
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(currentSub);
        NotificationPreferences updated = preferencesService.updatePreferences(empresaId, currentSub, preferences);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/type/{type}")
    public ResponseEntity<Void> updateTypePreference(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @PathVariable NotificationType type,
            @RequestBody Map<String, Boolean> preferences) {

        String currentSub = resolveUsuarioSub(userId, usuarioSub);
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(currentSub);
        boolean enabled = preferences.getOrDefault("enabled", true);
        boolean emailEnabled = preferences.getOrDefault("emailEnabled", true);
        boolean inAppEnabled = preferences.getOrDefault("inAppEnabled", true);

        preferencesService.updateTypePreference(empresaId, currentSub, type, enabled, emailEnabled, inAppEnabled);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/enabled/{type}")
    public ResponseEntity<Map<String, Boolean>> isNotificationEnabled(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @PathVariable NotificationType type) {

        String currentSub = resolveUsuarioSub(userId, usuarioSub);
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(currentSub);

        boolean enabled = preferencesService.isNotificationEnabled(empresaId, currentSub, type);
        boolean emailEnabled = preferencesService.isEmailEnabled(empresaId, currentSub, type);
        boolean inAppEnabled = preferencesService.isInAppEnabled(empresaId, currentSub, type);
        boolean inQuietHours = preferencesService.isInQuietHours(empresaId, currentSub);

        return ResponseEntity.ok(Map.of(
            "enabled", enabled,
            "emailEnabled", emailEnabled,
            "inAppEnabled", inAppEnabled,
            "inQuietHours", inQuietHours
        ));
    }
}
