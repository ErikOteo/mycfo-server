// src/main/java/notificacion/services/NotificationService.java
package notificacion.services;

import notificacion.dtos.NotificationDTO;
import notificacion.dtos.NotificationListResponse;
import notificacion.mappers.NotificationMapper;
import notificacion.models.Notification;
import notificacion.models.NotificationType;
import notificacion.models.Severity;
import notificacion.repositories.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository repo;
    private final EmailNotificationService emailService;
    private final NotificationPreferencesService preferencesService;

    public NotificationService(NotificationRepository repo,
                               EmailNotificationService emailService,
                               NotificationPreferencesService preferencesService) {
        this.repo = repo;
        this.emailService = emailService;
        this.preferencesService = preferencesService;
    }

    @Transactional(readOnly = true)
    public NotificationListResponse getNotifications(Long organizacionId,
                                                     String usuarioId,
                                                     String status,
                                                     int page,
                                                     int size) {
        return getNotifications(organizacionId, usuarioId, status, page, size, null);
    }

    @Transactional(readOnly = true)
    public NotificationListResponse getNotifications(Long organizacionId,
                                                     String usuarioId,
                                                     String status,
                                                     int page,
                                                     int size,
                                                     String since) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> pageData;
        
        if ("unread".equalsIgnoreCase(status)) {
            if (since != null && !since.isEmpty()) {
                pageData = repo.findByOrganizacionIdAndUsuarioIdAndIsReadFalseAndCreatedAtAfterOrderByCreatedAtDesc(
                    organizacionId, usuarioId, java.time.Instant.parse(since), pageable);
            } else {
                pageData = repo.findByOrganizacionIdAndUsuarioIdAndIsReadFalseOrderByCreatedAtDesc(
                    organizacionId, usuarioId, pageable);
            }
        } else {
            if (since != null && !since.isEmpty()) {
                pageData = repo.findByOrganizacionIdAndUsuarioIdAndCreatedAtAfterOrderByCreatedAtDesc(
                    organizacionId, usuarioId, java.time.Instant.parse(since), pageable);
            } else {
                pageData = repo.findByOrganizacionIdAndUsuarioIdOrderByCreatedAtDesc(
                    organizacionId, usuarioId, pageable);
            }
        }

        return buildListResponse(organizacionId, usuarioId, pageData);
    }

    @Transactional(readOnly = true)
    public int unreadCount(Long organizacionId, String usuarioId) {
        return repo.countByOrganizacionIdAndUsuarioIdAndIsReadFalse(organizacionId, usuarioId);
    }

    @Transactional
    public void markRead(Long organizacionId, String usuarioId, Long notifId, boolean isRead) {
        Notification notification = repo.findById(notifId).orElseThrow();
        enforceTenant(notification, organizacionId, usuarioId);
        notification.setRead(isRead);
        repo.save(notification);
        publishUnreadCount(organizacionId, usuarioId);
    }

    @Transactional
    public void markAllRead(Long organizacionId, String usuarioId) {
        var unread = repo
                .findByOrganizacionIdAndUsuarioIdAndIsReadFalseOrderByCreatedAtDesc(
                        organizacionId,
                        usuarioId,
                        Pageable.unpaged())
                .getContent();
        unread.forEach(notification -> notification.setRead(true));
        repo.saveAll(unread);
        publishUnreadCount(organizacionId, usuarioId);
    }

    @Transactional
    public NotificationDTO create(Notification notification) {
        if (notification.getOrganizacionId() == null || notification.getUsuarioId() == null) {
            throw new IllegalArgumentException("La notificacion debe incluir organizacion y usuario.");
        }

        // Respeta preferencia "Habilitado" (in-app) por tipo
        var prefsOpt = preferencesService.getPreferences(notification.getOrganizacionId(), notification.getUsuarioId());
        if (prefsOpt.isPresent()) {
            if (!preferencesService.isNotificationEnabled(notification.getOrganizacionId(),
                    notification.getUsuarioId(),
                    notification.getType())) {
                return null; // no crear ni enviar si está deshabilitado
            }
        }

        Notification saved = repo.save(notification);

        try {
            emailService.sendNotificationEmail(notification.getOrganizacionId(), notification.getUsuarioId(), saved);
        } catch (Exception e) {
            System.err.println("Error enviando email de notificacion: " + e.getMessage());
        }

        publishUnreadCount(notification.getOrganizacionId(), notification.getUsuarioId());
        return NotificationMapper.toDTO(saved);
    }

    @Transactional(readOnly = true)
    public NotificationListResponse getNotificationsByType(Long organizacionId,
                                                           String usuarioId,
                                                           NotificationType type,
                                                           int page,
                                                           int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> pageData = repo.findByOrganizacionIdAndUsuarioIdAndTypeOrderByCreatedAtDesc(
                organizacionId,
                usuarioId,
                type,
                pageable
        );
        return buildListResponse(organizacionId, usuarioId, pageData);
    }

    @Transactional(readOnly = true)
    public NotificationListResponse getNotificationsBySeverity(Long organizacionId,
                                                               String usuarioId,
                                                               Severity severity,
                                                               int page,
                                                               int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> pageData = repo.findByOrganizacionIdAndUsuarioIdAndSeverityOrderByCreatedAtDesc(
                organizacionId,
                usuarioId,
                severity,
                pageable
        );
        return buildListResponse(organizacionId, usuarioId, pageData);
    }

    @Transactional(readOnly = true)
    public NotificationListResponse searchNotifications(Long organizacionId,
                                                        String usuarioId,
                                                        String searchTerm,
                                                        int page,
                                                        int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> pageData = repo.findByOrganizacionIdAndUsuarioIdAndSearchTerm(
                organizacionId,
                usuarioId,
                searchTerm,
                pageable
        );
        return buildListResponse(organizacionId, usuarioId, pageData);
    }

    @Transactional
    public void deleteNotification(Long organizacionId, String usuarioId, Long notificationId) {
        Notification notification = repo.findById(notificationId).orElseThrow();
        enforceTenant(notification, organizacionId, usuarioId);
        repo.delete(notification);
        publishUnreadCount(organizacionId, usuarioId);
    }

    private NotificationListResponse buildListResponse(Long organizacionId,
                                                       String usuarioId,
                                                       Page<Notification> pageData) {
        var items = pageData.getContent().stream()
                .map(NotificationMapper::toDTO)
                .toList();
        int unread = repo.countByOrganizacionIdAndUsuarioIdAndIsReadFalse(organizacionId, usuarioId);
        return new NotificationListResponse(unread, items);
    }

    private void enforceTenant(Notification notification, Long organizacionId, String usuarioId) {
        if (!notification.getOrganizacionId().equals(organizacionId) ||
            !notification.getUsuarioId().equals(usuarioId)) {
            throw new IllegalArgumentException("Notificacion fuera del alcance del usuario actual");
        }
    }

    private void publishUnreadCount(Long organizacionId, String usuarioId) {
        // WebSocket eliminado - solo email notifications
        // El contador de no leídas ya no se necesita sin WebSocket
        // int unreadCount = repo.countByOrganizacionIdAndUsuarioIdAndIsReadFalse(organizacionId, usuarioId);
        // webSocketService.sendUnreadCountUpdate(usuarioId, unreadCount); // Eliminado
    }
}
