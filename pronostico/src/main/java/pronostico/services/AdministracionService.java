package pronostico.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

/**
 * Servicio para comunicarse con el microservicio de Administracion.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdministracionService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${mycfo.administracion.url}")
    private String administracionUrl;

    /**
     * Obtiene el ID de empresa de un usuario por su sub (Cognito)
     * @param usuarioSub Sub del usuario de Cognito
     * @return ID de la empresa del usuario
     * @throws RuntimeException si el usuario no existe o no tiene empresa asociada
     */
    public Long obtenerEmpresaIdPorUsuarioSub(String usuarioSub, String authorization) {
        try {
            String url = administracionUrl + "/api/empresas/usuario/" + usuarioSub + "/id";
            log.info("Llamando a administración para obtener empresa del usuario: {}", usuarioSub);
            log.debug("URL: {}", url);

            HttpHeaders headers = new HttpHeaders();
            if (authorization != null && !authorization.isBlank()) {
                headers.set("Authorization", authorization);
            }
            headers.set("X-Usuario-Sub", usuarioSub);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Long> response = restTemplate.exchange(url, HttpMethod.GET, entity, Long.class);

            Long empresaId = response.getBody();
            if (empresaId == null) {
                throw new RuntimeException("El usuario no tiene empresa asociada");
            }

            log.info("Empresa ID obtenida: {} para usuario: {}", empresaId, usuarioSub);
            return empresaId;

        } catch (HttpClientErrorException.NotFound e) {
            log.error("Usuario no encontrado o sin empresa: {}", usuarioSub);
            throw new RuntimeException("Usuario no encontrado o sin empresa asociada: " + usuarioSub);
        } catch (Exception e) {
            log.error("Error al obtener empresa del usuario {}: {}", usuarioSub, e.getMessage());
            throw new RuntimeException("Error al comunicarse con el servicio de administración", e);
        }
    }

    // Compatibilidad hacia atrás
    public Long obtenerEmpresaIdPorUsuarioSub(String usuarioSub) {
        return obtenerEmpresaIdPorUsuarioSub(usuarioSub, null);
    }

    /**
     * Verifica si el usuario indicado es administrador según el microservicio de administración.
     */
    public boolean esAdministrador(String usuarioSub) {
        try {
            String url = administracionUrl + "/api/usuarios/perfil";

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Usuario-Sub", usuarioSub);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<java.util.Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    java.util.Map.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return false;
            }

            Object rol = response.getBody().get("rol");
            return rol != null && "ADMINISTRADOR".equalsIgnoreCase(rol.toString());
        } catch (Exception e) {
            log.error("Error verificando rol de administrador para usuario {}: {}", usuarioSub, e.getMessage());
            return false;
        }
    }
}
