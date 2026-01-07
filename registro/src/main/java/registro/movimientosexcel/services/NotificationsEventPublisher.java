package registro.movimientosexcel.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import registro.cargarDatos.models.Movimiento;
import registro.movimientosexcel.dtos.MovementEventPayload;

import java.time.Instant;
import java.time.ZoneId;

@Service
public class NotificationsEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(NotificationsEventPublisher.class);

    private final RestTemplate rest;
    private final String baseUrl; // ej.: http://localhost:8084

    public NotificationsEventPublisher(
            RestTemplate rest,
            @Value("${notificacion.service.url}") String baseUrl) {
        this.rest = rest;
        this.baseUrl = baseUrl.replaceAll("/+$", ""); // sin slash final
    }

    /**
     * Publica un evento de movimiento a partir de un Registro.
     * @param movimiento       Entidad Registro que disparará el evento.
     * @param fallbackUserId Id de usuario en caso de que el registro no tenga asociado un usuario explícito.
     */
    public void publishMovement(Movimiento movimiento, Long fallbackUserId) {
        // Si no hay un identificador de referencia, usamos su ID de base de datos
        String refId = (movimiento.getCategoria() != null && !movimiento.getCategoria().isEmpty())
                ? movimiento.getCategoria()
                : String.valueOf(movimiento.getId());

        MovementEventPayload payload = new MovementEventPayload(
                fallbackUserId != null ? fallbackUserId : 1L,
                refId,
                toInstant(movimiento),                    // LocalDate → Instant
                movimiento.getMontoTotal(),               // Double → BigDecimal se maneja en MovementEventPayload
                movimiento.getDescripcion()               // descripción libre del registro
        );

        String url = baseUrl + "/api/events/movements";
        try {
            rest.postForEntity(url, payload, Void.class);
        } catch (Exception e) {
            // No frenamos la carga del Excel si el micro de notificaciones está caído
            log.warn("No se pudo publicar evento a Notificaciones [{}]: {}", url, e.getMessage());
        }
    }

    private Instant toInstant(Movimiento movimiento) {
        if (movimiento.getFechaEmision() == null) {
            return Instant.now(); // fallback en caso de no tener fecha
        }
        return movimiento.getFechaEmision()
                .atZone(ZoneId.systemDefault())
                .toInstant();
    }
}
