package pronostico.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import pronostico.models.ForecastLinea;

import java.util.List;

public interface ForecastLineaRepository extends JpaRepository<ForecastLinea, Long> {
    
    List<ForecastLinea> findByForecast_Id(Long forecastId);
    
    void deleteByForecast_Id(Long forecastId);
}

