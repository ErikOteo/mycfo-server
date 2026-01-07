// src/main/java/notificacion/repositories/NotificationRepository.java
package notificacion.repositories;

import notificacion.models.Notification;
import notificacion.models.NotificationType;
import notificacion.models.ResourceType;
import notificacion.models.Severity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    interface TenantScope {
        Long getOrganizacionId();
        String getUsuarioId();
    }

    Page<Notification> findByOrganizacionIdAndUsuarioIdOrderByCreatedAtDesc(Long organizacionId, String usuarioId, Pageable pageable);

    Page<Notification> findByOrganizacionIdAndUsuarioIdAndIsReadFalseOrderByCreatedAtDesc(Long organizacionId, String usuarioId, Pageable pageable);

    Page<Notification> findByOrganizacionIdAndUsuarioIdAndIsReadFalseAndCreatedAtAfterOrderByCreatedAtDesc(Long organizacionId, String usuarioId, Instant createdAt, Pageable pageable);

    Page<Notification> findByOrganizacionIdAndUsuarioIdAndCreatedAtAfterOrderByCreatedAtDesc(Long organizacionId, String usuarioId, Instant createdAt, Pageable pageable);

    int countByOrganizacionIdAndUsuarioIdAndIsReadFalse(Long organizacionId, String usuarioId);

    boolean existsByOrganizacionIdAndUsuarioIdAndTypeAndResourceIdAndCreatedAtBetween(
            Long organizacionId,
            String usuarioId,
            NotificationType type,
            String resourceId,
            Instant from,
            Instant to
    );

    @Query("SELECT DISTINCT n.organizacionId AS organizacionId, n.usuarioId AS usuarioId " +
           "FROM Notification n " +
           "WHERE n.createdAt BETWEEN :start AND :end")
    List<TenantScope> findDistinctTenantScopeByCreatedAtBetween(@Param("start") Instant start, @Param("end") Instant end);

    List<Notification> findByOrganizacionIdAndUsuarioIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long organizacionId,
            String usuarioId,
            Instant start,
            Instant end
    );

    Page<Notification> findByOrganizacionIdAndUsuarioIdAndTypeOrderByCreatedAtDesc(
            Long organizacionId,
            String usuarioId,
            NotificationType type,
            Pageable pageable
    );

    Page<Notification> findByOrganizacionIdAndUsuarioIdAndSeverityOrderByCreatedAtDesc(
            Long organizacionId,
            String usuarioId,
            Severity severity,
            Pageable pageable
    );

    @Query("SELECT n FROM Notification n WHERE n.organizacionId = :organizacionId AND n.usuarioId = :usuarioId AND " +
           "(LOWER(n.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(n.body) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY n.createdAt DESC")
    Page<Notification> findByOrganizacionIdAndUsuarioIdAndSearchTerm(@Param("organizacionId") Long organizacionId,
                                                                     @Param("usuarioId") String usuarioId,
                                                                     @Param("searchTerm") String searchTerm,
                                                                     Pageable pageable);

    boolean existsByOrganizacionIdAndUsuarioIdAndTypeAndResourceTypeAndResourceIdAndCreatedAtAfter(
            Long organizacionId,
            String usuarioId,
            NotificationType type,
            ResourceType resourceType,
            String resourceId,
            Instant createdAt);
}

