package pronostico.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import pronostico.models.ForecastConfig;

import java.util.List;

public interface ForecastConfigRepository extends JpaRepository<ForecastConfig, Long> {
    
    List<ForecastConfig> findByOrganizacionId(Long organizacionId);
    
    List<ForecastConfig> findByOrganizacionIdAndActivo(Long organizacionId, boolean activo);
    
    boolean existsByOrganizacionIdAndNombre(Long organizacionId, String nombre);
}

