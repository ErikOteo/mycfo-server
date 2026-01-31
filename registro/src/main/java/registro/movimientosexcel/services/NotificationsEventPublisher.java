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
import java.util.HashMap;
import java.util.Map;

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
    public void publishMovement(Movimiento movimiento, String usuarioSub, Long fallbackUserId) {
        // Si no hay un identificador de referencia, usamos su ID de base de datos
        String refId = (movimiento.getCategoria() != null && !movimiento.getCategoria().isEmpty())
                ? movimiento.getCategoria()
                : String.valueOf(movimiento.getId());

        MovementEventPayload payload = new MovementEventPayload(
                usuarioSub != null ? usuarioSub : (fallbackUserId != null ? String.valueOf(fallbackUserId) : null),
                refId,
                toInstant(movimiento),                    // LocalDate → Instant
                movimiento.getMontoTotal(),               // Double → BigDecimal se maneja en MovementEventPayload
                movimiento.getDescripcion(),              // descripción libre del registro
                movimiento.getMoneda() != null ? movimiento.getMoneda().name() : "ARS"
        );

        String url = baseUrl + "/api/events/movements";
        postWithFallback(url, payload);
    }

    public void publishImport(String importId,
                              String sourceName,
                              String accountName,
                              String fileName,
                              int totalRows,
                              String usuarioSub) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", usuarioSub);
        payload.put("importId", importId);
        payload.put("sourceName", sourceName);
        payload.put("accountName", accountName);
        payload.put("totalRows", totalRows);
        payload.put("fileName", fileName);
        payload.put("importedAt", Instant.now());

        String url = baseUrl + "/api/events/movements/imported";
        postWithFallback(url, payload);
    }

    public void publishDuplicate(String usuarioSub,
                                 String refId,
                                 String description,
                                 String accountName,
                                 Instant occurredAt,
                                 String duplicateOfRef) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", usuarioSub);
        payload.put("refId", refId);
        payload.put("description", description);
        payload.put("accountName", accountName);
        payload.put("occurredAt", occurredAt != null ? occurredAt : Instant.now());
        payload.put("duplicateOfRef", duplicateOfRef);

        String url = baseUrl + "/api/events/movements/duplicate";
        postWithFallback(url, payload);
    }

    public void publishMpLinked(String usuarioSub, Long accountId, String accountName) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", usuarioSub);
        payload.put("accountId", accountId);
        payload.put("accountName", accountName);

        String url = baseUrl + "/api/events/accounts/mp-linked";
        postWithFallback(url, payload);
    }

    private Instant toInstant(Movimiento movimiento) {
        if (movimiento.getFechaEmision() == null) {
            return Instant.now(); // fallback en caso de no tener fecha
        }
        return movimiento.getFechaEmision()
                .atZone(ZoneId.systemDefault())
                .toInstant();
    }

    private void postWithFallback(String url, Object payload) {
        try {
            rest.postForEntity(url, payload, Void.class);
        } catch (Exception e) {
            if (e.getCause() instanceof java.net.UnknownHostException) {
                String fallback = "http://localhost:8084" + url.substring(url.indexOf("/api/"));
                log.warn("Host no resuelve, probando fallback {}", fallback);
                try {
                    rest.postForEntity(fallback, payload, Void.class);
                    return;
                } catch (Exception ex2) {
                    log.warn("Fallback también falló: {}", ex2.getMessage());
                }
            }
            log.warn("No se pudo publicar a Notificaciones [{}]: {}", url, e.getMessage());
        }
    }
}
