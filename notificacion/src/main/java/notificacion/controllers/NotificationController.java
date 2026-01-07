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
    @GetMapping
    public ResponseEntity<NotificationListResponse> list(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String since
    ) {
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        return ResponseEntity.ok(service.getNotifications(empresaId, usuarioSub, status, page, size, since));
    }

    @GetMapping("/unreadCount")
    public ResponseEntity<?> unreadCount(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub
    ) {
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        return ResponseEntity.ok(java.util.Map.of("unread", service.unreadCount(empresaId, usuarioSub)));
    }

    @PatchMapping("/{notifId}")
    public ResponseEntity<?> markRead(
            @PathVariable String userId,
            @PathVariable Long notifId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestBody MarkReadRequest body
    ) {
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        service.markRead(empresaId, usuarioSub, notifId, body.is_read());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/markAllRead")
    public ResponseEntity<?> markAllRead(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub
    ) {
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        service.markAllRead(empresaId, usuarioSub);
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
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        return ResponseEntity.ok(service.getNotificationsByType(empresaId, usuarioSub, type, page, size));
    }

    @GetMapping("/severity/{severity}")
    public ResponseEntity<NotificationListResponse> getBySeverity(
            @PathVariable String userId,
            @PathVariable Severity severity,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        return ResponseEntity.ok(service.getNotificationsBySeverity(empresaId, usuarioSub, severity, page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<NotificationListResponse> search(
            @PathVariable String userId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        return ResponseEntity.ok(service.searchNotifications(empresaId, usuarioSub, q, page, size));
    }

    @DeleteMapping("/{notifId}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable String userId,
            @PathVariable Long notifId,
            @RequestHeader("X-Usuario-Sub") String usuarioSub
    ) {
        Long empresaId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        service.deleteNotification(empresaId, usuarioSub, notifId);
        return ResponseEntity.noContent().build();
    }
}
