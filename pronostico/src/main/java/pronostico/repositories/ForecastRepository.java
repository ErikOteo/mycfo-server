package pronostico.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import pronostico.models.Forecast;

import java.util.List;

public interface ForecastRepository extends JpaRepository<Forecast, Long> {
    
    List<Forecast> findByOrganizacionId(Long organizacionId);
    
    List<Forecast> findByOrganizacionIdAndEliminado(Long organizacionId, boolean eliminado);
    
    List<Forecast> findByForecastConfigId(Long forecastConfigId);
}

