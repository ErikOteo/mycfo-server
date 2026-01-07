package notificacion.repositories;

import notificacion.models.CustomReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
@Repository
public interface CustomReminderRepository extends JpaRepository<CustomReminder, Long> {
    
    List<CustomReminder> findByOrganizacionIdAndUsuarioIdAndIsActiveTrueOrderByScheduledForAsc(Long organizacionId, String usuarioId);
    
    @Query("SELECT r FROM CustomReminder r WHERE r.isActive = true AND r.isRecurring = false AND r.scheduledFor <= :now ORDER BY r.scheduledFor ASC")
    List<CustomReminder> findDueReminders(@Param("now") Instant now);
    
    @Query("SELECT r FROM CustomReminder r WHERE r.isActive = true AND r.isRecurring = true AND r.nextTrigger <= :now ORDER BY r.nextTrigger ASC")
    List<CustomReminder> findRecurringReminders(@Param("now") Instant now);
    
    List<CustomReminder> findByOrganizacionIdAndUsuarioIdAndIsActiveTrue(Long organizacionId, String usuarioId);
    
    void deleteByOrganizacionIdAndUsuarioIdAndIsActiveFalse(Long organizacionId, String usuarioId);
}
