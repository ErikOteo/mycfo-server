package notificacion.repositories;

import notificacion.models.NotificationPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationPreferencesRepository extends JpaRepository<NotificationPreferences, Long> {

    Optional<NotificationPreferences> findByOrganizacionIdAndUsuarioId(Long organizacionId, String usuarioId);

    boolean existsByOrganizacionIdAndUsuarioId(Long organizacionId, String usuarioId);

    interface TenantScope {
        Long getOrganizacionId();
        String getUsuarioId();
    }

    @Query("SELECT DISTINCT p.organizacionId AS organizacionId, p.usuarioId AS usuarioId FROM NotificationPreferences p")
    List<TenantScope> findAllTenantScopes();
}
