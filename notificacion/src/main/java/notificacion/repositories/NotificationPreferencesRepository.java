package notificacion.repositories;

import notificacion.models.NotificationPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationPreferencesRepository extends JpaRepository<NotificationPreferences, Long> {
    
    Optional<NotificationPreferences> findByOrganizacionIdAndUsuarioId(Long organizacionId, String usuarioId);
    
    boolean existsByOrganizacionIdAndUsuarioId(Long organizacionId, String usuarioId);
}
