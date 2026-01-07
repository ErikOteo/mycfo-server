package notificacion.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import notificacion.dtos.UsuarioAdministracionDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdministracionService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${mycfo.administracion.url}")
    private String administracionUrl;

    public Long obtenerEmpresaIdPorUsuarioSub(String usuarioSub) {
        try {
            String url = administracionUrl + "/api/empresas/usuario/" + usuarioSub + "/id";
            log.info("Consultando administración para obtener empresa del usuario {}", usuarioSub);
            Long empresaId = restTemplate.getForObject(url, Long.class);

            if (empresaId == null) {
                throw new RuntimeException("El usuario no tiene empresa asociada");
            }

            return empresaId;
        } catch (HttpClientErrorException.NotFound e) {
            log.error("Usuario {} no encontrado en administración", usuarioSub);
            throw new RuntimeException("Usuario no encontrado o sin empresa asociada: " + usuarioSub);
        } catch (Exception e) {
            log.error("Error obteniendo empresa para {}: {}", usuarioSub, e.getMessage());
            throw new RuntimeException("Error al comunicarse con administración", e);
        }
    }

    public String obtenerEmailPorUsuarioSub(String usuarioSub) {
        try {
            String url = administracionUrl + "/api/usuarios/" + usuarioSub;
            log.info("Consultando administración para obtener email del usuario {}", usuarioSub);
            UsuarioAdministracionDTO usuario = restTemplate.getForObject(url, UsuarioAdministracionDTO.class);

            if (usuario == null || usuario.getEmail() == null || usuario.getEmail().trim().isEmpty()) {
                throw new RuntimeException("El usuario no tiene email configurado");
            }

            return usuario.getEmail().trim();
        } catch (HttpClientErrorException.NotFound e) {
            log.error("Usuario {} no encontrado en administración", usuarioSub);
            throw new RuntimeException("Usuario no encontrado o sin email configurado: " + usuarioSub);
        } catch (Exception e) {
            log.error("Error obteniendo email para {}: {}", usuarioSub, e.getMessage());
            throw new RuntimeException("Error al comunicarse con administración", e);
        }
    }

    public List<UsuarioAdministracionDTO> obtenerUsuariosPorEmpresaId(Long empresaId) {
        try {
            String url = administracionUrl + "/api/usuarios/empresa/" + empresaId;
            log.info("Consultando administracion para obtener usuarios de la empresa {}", empresaId);
            UsuarioAdministracionDTO[] response = restTemplate.getForObject(url, UsuarioAdministracionDTO[].class);
            if (response == null) {
                return List.of();
            }
            return Arrays.asList(response);
        } catch (Exception e) {
            log.error("Error obteniendo usuarios para empresa {}: {}", empresaId, e.getMessage());
            throw new RuntimeException("Error al comunicarse con administracion para obtener usuarios de empresa", e);
        }
    }
}
