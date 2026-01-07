package registro.cargarDatos.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import registro.cargarDatos.models.Movimiento;
import registro.cargarDatos.dtos.MovementCreatedEvent;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.ZoneOffset;

@Service
public class MovimientoEventService {

    private final RestTemplate restTemplate;
    
    @Value("${notificacion.service.url}")
    private String notificacionServiceUrl;

    public MovimientoEventService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void sendMovementCreatedEvent(Movimiento movimiento) {
        try {
            // Usar directamente el String UUID del usuario (sin conversión a Long)
            String userId = movimiento.getUsuarioId();
            if (userId == null || userId.isEmpty()) {
                System.err.println("Error: userId es nulo o vacío, no se puede enviar evento");
                return;
            }

            // Crear el evento con DTO correcto (String userId)
            MovementCreatedEvent event = new MovementCreatedEvent(
                userId,
                movimiento.getId().toString(),
                movimiento.getFechaEmision() != null 
                    ? movimiento.getFechaEmision().atZone(ZoneId.systemDefault()).toInstant()
                    : java.time.Instant.now(),
                BigDecimal.valueOf(movimiento.getMontoTotal()),
                movimiento.getDescripcion() != null ? movimiento.getDescripcion() : ""
            );

            // Enviar al servicio de notificaciones
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<MovementCreatedEvent> request = new HttpEntity<>(event, headers);
            
            restTemplate.postForObject(
                notificacionServiceUrl + "/api/events/movements",
                request,
                Void.class
            );
            
        } catch (Exception e) {
            // Log error pero no fallar la operación principal
            System.err.println("Error enviando evento de movimiento: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
