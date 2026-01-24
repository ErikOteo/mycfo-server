package pronostico.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio para comunicarse con el microservicio de Registro
 */
@Service
@Slf4j
public class RegistroService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${mycfo.registro.url}")
    private String registroUrl;

    /**
     * Obtiene los movimientos mensuales históricos de una empresa
     * @param organizacionId ID de la empresa
     * @return Lista de movimientos agrupados por mes
     */
    public Map<String, Map<String, List<Map<String, Object>>>> obtenerMovimientosMensuales(
            Long organizacionId,
            String authorization,
            String usuarioSub
    ) {
        try {
            String url = registroUrl + "/movimientos/empresa/" + organizacionId + "/mensuales";
            log.info("Llamando a registro para obtener movimientos mensuales de empresa: {}", organizacionId);

            @SuppressWarnings("unchecked")
            ResponseEntity<Map> response;

            // Si tenemos token y usuario, reenviamos headers; de lo contrario, intentamos sin headers
            if (authorization != null && !authorization.isBlank()) {
                HttpHeaders headers = new HttpHeaders();
                headers.add(HttpHeaders.AUTHORIZATION, authorization);
                headers.add("X-Usuario-Sub", usuarioSub);

                HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
                response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, Map.class);
            } else {
                response = restTemplate.exchange(url, HttpMethod.GET, null, Map.class);
            }

            log.info("Movimientos mensuales obtenidos correctamente");
            return response.getBody() != null ? response.getBody() : new HashMap<>();
            
        } catch (Exception e) {
            log.error("Error al obtener movimientos mensuales: {}", e.getMessage());
            throw new RuntimeException("Error al comunicarse con el servicio de registro", e);
        }
    }
}
