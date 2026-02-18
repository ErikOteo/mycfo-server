// src/main/java/notificacion/controllers/NotificationController.java
package notificacion.controllers;

import notificacion.dtos.MarkReadRequest;
import notificacion.dtos.NotificationListResponse;
import notificacion.models.NotificationType;
import notificacion.models.Severity;
import notificacion.services.AdministracionService;
import notificacion.services.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/{userId}/notifications")
public class NotificationController {

    private final NotificationService service;
    private final AdministracionService administracionService;

    public NotificationController(NotificationService service,
                                  AdministracionService administracionService) {
        this.service = service;
        this.administracionService = administracionService;
    }

    private String resolveUsuarioSub(String pathUserId, String headerUsuarioSub) {
        return (headerUsuarioSub != null && !headerUsuarioSub.isBlank())
                ? headerUsuarioSub
                : pathUserId;
    }

    @GetMapping
    public ResponseEntity<NotificationListResponse> list(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String since
    ) {
        String currentSub = resolveUsuarioSub(userId, usuarioSub);
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(currentSub);
        return ResponseEntity.ok(service.getNotifications(empresaId, currentSub, status, page, size, since));
    }

    @GetMapping("/unreadCount")
    public ResponseEntity<?> unreadCount(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub
    ) {
        String currentSub = resolveUsuarioSub(userId, usuarioSub);
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(currentSub);
        return ResponseEntity.ok(java.util.Map.of("unread", service.unreadCount(empresaId, currentSub)));
    }

    @PatchMapping("/{notifId}")
    public ResponseEntity<?> markRead(
            @PathVariable String userId,
            @PathVariable Long notifId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestBody MarkReadRequest body
    ) {
        String currentSub = resolveUsuarioSub(userId, usuarioSub);
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(currentSub);
        service.markRead(empresaId, currentSub, notifId, body.is_read());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/markAllRead")
    public ResponseEntity<?> markAllRead(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub
    ) {
        String currentSub = resolveUsuarioSub(userId, usuarioSub);
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(currentSub);
        service.markAllRead(empresaId, currentSub);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<NotificationListResponse> getByType(
            @PathVariable String userId,
            @PathVariable NotificationType type,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        String currentSub = resolveUsuarioSub(userId, usuarioSub);
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(currentSub);
        return ResponseEntity.ok(service.getNotificationsByType(empresaId, currentSub, type, page, size));
    }

    @GetMapping("/severity/{severity}")
    public ResponseEntity<NotificationListResponse> getBySeverity(
            @PathVariable String userId,
            @PathVariable Severity severity,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        String currentSub = resolveUsuarioSub(userId, usuarioSub);
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(currentSub);
        return ResponseEntity.ok(service.getNotificationsBySeverity(empresaId, currentSub, severity, page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<NotificationListResponse> search(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        String currentSub = resolveUsuarioSub(userId, usuarioSub);
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(currentSub);
        return ResponseEntity.ok(service.searchNotifications(empresaId, currentSub, q, page, size));
    }

    @DeleteMapping("/{notifId}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable String userId,
            @PathVariable Long notifId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub
    ) {
        String currentSub = resolveUsuarioSub(userId, usuarioSub);
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(currentSub);
        service.deleteNotification(empresaId, currentSub, notifId);
        return ResponseEntity.noContent().build();
    }
}
