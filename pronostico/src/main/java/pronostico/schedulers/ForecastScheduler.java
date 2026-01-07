package pronostico.schedulers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pronostico.dtos.ForecastDTO;
import pronostico.models.ForecastConfig;
import pronostico.repositories.ForecastConfigRepository;
import pronostico.services.ForecastService;

import java.time.LocalDate;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class ForecastScheduler {

    private final ForecastConfigRepository forecastConfigRepository;
    private final ForecastService forecastService;

    /**
     * Genera forecasts automáticamente según las configuraciones activas
     * Se ejecuta el primer día de cada mes a las 2:00 AM
     */
    @Scheduled(cron = "0 0 2 1 * *") // Primer día de cada mes a las 2:00 AM
    @Transactional
    public void generarForecastsAutomaticos() {
        log.info("=== INICIANDO GENERACIÓN AUTOMÁTICA DE FORECASTS ===");
        
        // Obtener todas las configuraciones activas
        List<ForecastConfig> configsActivas = forecastConfigRepository.findAll().stream()
                .filter(ForecastConfig::isActivo)
                .collect(java.util.stream.Collectors.toList());
        
        log.info("Configuraciones activas encontradas: {}", configsActivas.size());
        
        int generados = 0;
        int errores = 0;
        
        for (ForecastConfig config : configsActivas) {
            try {
                // Verificar si debe generarse según la frecuencia
                if (debeGenerarForecast(config)) {
                    log.info("Generando forecast para configuración ID={}, Organización={}, Frecuencia={}m, Horizonte={}m",
                            config.getId(), config.getOrganizacionId(), config.getMesesFrecuencia(), config.getHorizonteMeses());
                    
                    ForecastDTO forecast = forecastService.generarForecast(config.getId(), "SISTEMA");
                    generados++;
                    
                    log.info("✅ Forecast generado: ID={}", forecast.getId());
                } else {
                    log.debug("Forecast omitido para config ID={}: no corresponde generarlo en esta fecha", config.getId());
                }
                
            } catch (Exception e) {
                errores++;
                log.error("❌ Error generando forecast para config ID={}: {}", config.getId(), e.getMessage(), e);
            }
        }
        
        log.info("=== FIN GENERACIÓN AUTOMÁTICA: {} generados, {} errores ===", generados, errores);
    }

    /**
     * Determina si debe generarse un forecast según la configuración y el día actual
     */
    private boolean debeGenerarForecast(ForecastConfig config) {
        LocalDate hoy = LocalDate.now();
        
        // Solo generar el primer día del mes
        if (hoy.getDayOfMonth() != 1) {
            return false;
        }
        
        // Verificar si pasó el período de frecuencia desde la última generación
        // Por ejemplo, si frecuencia=6, generar en Enero y Julio
        int mes = hoy.getMonthValue();
        
        // Calcular cuál debería ser el mes de generación
        // Si frecuencia=6: generar en meses 1, 7 (enero, julio)
        // Si frecuencia=3: generar en meses 1, 4, 7, 10 (enero, abril, julio, octubre)
        int mesModulo = ((mes - 1) % config.getMesesFrecuencia());
        
        return mesModulo == 0;
    }

    /**
     * Generar forecast manualmente para una configuración específica
     * Útil para testing o generación bajo demanda
     */
    @Transactional
    public ForecastDTO generarForecastManual(Long forecastConfigId) {
        log.info("Generando forecast manual para config ID={}", forecastConfigId);
        return forecastService.generarForecast(forecastConfigId, "SISTEMA");
    }
}

