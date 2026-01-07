package pronostico.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import pronostico.models.Presupuesto;
import pronostico.models.PresupuestoLinea;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class PresupuestoEventService {

    private final RestTemplate restTemplate;
    
    @Value("${notifications.base-url:${notificacion.service.url:http://localhost:8084}}")
    private String notificationsBaseUrl;

    public PresupuestoEventService() {
        this.restTemplate = new RestTemplate();
    }

    public void sendBudgetExceededEvent(Presupuesto presupuesto, PresupuestoLinea linea) {
        try {
            // Calcular variación
            BigDecimal budgeted = linea.getMontoEstimado();
            BigDecimal actual = linea.getMontoReal();
            BigDecimal variance = actual.subtract(budgeted);

            // Crear el evento
            Map<String, Object> event = new HashMap<>();
            event.put("userId", 1L); // TODO: Obtener del contexto de usuario
            event.put("budgetId", presupuesto.getId());
            event.put("budgetName", presupuesto.getNombre());
            event.put("category", linea.getCategoria());
            event.put("budgeted", budgeted);
            event.put("actual", actual);
            event.put("variance", variance);
            event.put("occurredAt", Instant.now());

            // Enviar al servicio de notificaciones
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(event, headers);
            
            restTemplate.postForObject(
                notificationsBaseUrl + "/api/events/budget-exceeded",
                request,
                Void.class
            );
            
        } catch (Exception e) {
            System.err.println("Error enviando evento de presupuesto excedido: " + e.getMessage());
        }
    }

    public void sendBudgetCreatedEvent(Presupuesto presupuesto) {
        try {
            // Crear el evento
            Map<String, Object> event = new HashMap<>();
            event.put("userId", 1L); // TODO: Obtener del contexto de usuario
            event.put("companyId", presupuesto.getOrganizacionId());
            event.put("budgetId", presupuesto.getId());
            event.put("budgetName", presupuesto.getNombre());
            event.put("period", buildPeriod(presupuesto));
            event.put("link", "/app/presupuestos/%d/detalle/actual".formatted(presupuesto.getId()));

            // Enviar al servicio de notificaciones
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(event, headers);
            
            restTemplate.postForObject(
                notificationsBaseUrl + "/api/events/budget-created",
                request,
                Void.class
            );
            
        } catch (Exception e) {
            System.err.println("Error enviando evento de presupuesto creado: " + e.getMessage());
        }
    }

    public void sendBudgetDeletedEvent(Presupuesto presupuesto) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("userId", 1L); // TODO: Obtener del contexto de usuario
            event.put("companyId", presupuesto.getOrganizacionId());
            event.put("budgetId", presupuesto.getId());
            event.put("budgetName", presupuesto.getNombre());
            event.put("period", buildPeriod(presupuesto));
            event.put("link", "/app/presupuestos?tab=eliminados");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(event, headers);

            restTemplate.postForObject(
                    notificationsBaseUrl + "/api/events/budget-deleted",
                    request,
                    Void.class
            );
        } catch (Exception e) {
            System.err.println("Error enviando evento de presupuesto eliminado: " + e.getMessage());
        }
    }

    private String buildPeriod(Presupuesto presupuesto) {
        String desde = presupuesto.getDesde();
        String hasta = presupuesto.getHasta();

        String desdeYm = extractYearMonth(desde);
        String hastaYm = extractYearMonth(hasta);

        if (desdeYm == null && hastaYm == null) {
            return null;
        }
        if (desdeYm != null && hastaYm != null && !desdeYm.equals(hastaYm)) {
            return desdeYm + " - " + hastaYm;
        }
        return desdeYm != null ? desdeYm : hastaYm;
    }

    private String extractYearMonth(String raw) {
        if (raw == null || raw.length() < 7) {
            return null;
        }
        return raw.substring(0, 7);
    }
}
