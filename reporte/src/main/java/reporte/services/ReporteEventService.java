package reporte.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class ReporteEventService {

    private final RestTemplate restTemplate;
    
    @Value("${notificacion.service.url:http://localhost:8084}")
    private String notificacionServiceUrl;

    public ReporteEventService() {
        this.restTemplate = new RestTemplate();
    }

    public void sendReportGeneratedEvent(String reportType, String reportName, String period, boolean hasAnomalies) {
        try {
            // Crear el evento
            Map<String, Object> event = new HashMap<>();
            event.put("userId", 1L); // TODO: Obtener del contexto de usuario
            event.put("reportType", reportType);
            event.put("reportName", reportName);
            event.put("period", period);
            event.put("downloadUrl", "/reportes/download/" + reportName);
            event.put("generatedAt", Instant.now());
            event.put("hasAnomalies", hasAnomalies);

            // Enviar al servicio de notificaciones
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(event, headers);
            
            restTemplate.postForObject(
                notificacionServiceUrl + "/api/events/report-generated",
                request,
                Void.class
            );
            
        } catch (Exception e) {
            System.err.println("Error enviando evento de reporte generado: " + e.getMessage());
        }
    }

    public void sendMonthlySummaryEvent(String period) {
        try {
            // Crear el evento
            Map<String, Object> event = new HashMap<>();
            event.put("userId", 1L); // TODO: Obtener del contexto de usuario
            event.put("reportType", "MONTHLY_SUMMARY");
            event.put("reportName", "Resumen Mensual - " + period);
            event.put("period", period);
            event.put("downloadUrl", "/reportes/mensual/" + period);
            event.put("generatedAt", Instant.now());
            event.put("hasAnomalies", false);

            // Enviar al servicio de notificaciones
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(event, headers);
            
            restTemplate.postForObject(
                notificacionServiceUrl + "/api/events/report-generated",
                request,
                Void.class
            );
            
        } catch (Exception e) {
            System.err.println("Error enviando evento de resumen mensual: " + e.getMessage());
        }
    }
}
