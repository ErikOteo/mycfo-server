package administracion.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import administracion.models.SolicitudAcceso;
import administracion.models.Empresa;
import administracion.repositories.SolicitudAccesoRepository;
import administracion.repositories.EmpresaRepository;
import java.util.List;

import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class SolicitudAccesoService {

    private final SolicitudAccesoRepository solicitudRepository;
    private final EmpresaRepository empresaRepository;
    private final UsuarioService usuarioService;
    private final RestTemplate restTemplate;

    @Value("${app.notificacion.url:http://localhost:8090/api/notificacion}")
    private String notificacionUrl;

    public SolicitudAcceso crearSolicitud(String usuarioSub, String usuarioNombre, String usuarioEmail,
            Long empresaId) {
        // Verificar si la empresa existe
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        // Verificar si ya existe una solicitud pendiente
        if (solicitudRepository.existsByUsuarioSubAndEmpresaIdAndEstado(usuarioSub, empresaId,
                SolicitudAcceso.EstadoSolicitud.PENDIENTE)) {
            throw new RuntimeException("Ya tienes una solicitud pendiente para esta empresa.");
        }

        SolicitudAcceso solicitud = SolicitudAcceso.builder()
                .usuarioSub(usuarioSub)
                .usuarioNombre(usuarioNombre)
                .usuarioEmail(usuarioEmail)
                .empresa(empresa)
                .estado(SolicitudAcceso.EstadoSolicitud.PENDIENTE)
                .build();

        SolicitudAcceso guardada = solicitudRepository.save(solicitud);

        // Notificar al servicio de notificaciones
        notificarNuevaSolicitud(guardada);

        return guardada;
    }

    private void notificarNuevaSolicitud(SolicitudAcceso solicitud) {
        try {
            String url = notificacionUrl + "/api/notificaciones/solicitar-acceso";
            Map<String, String> body = new HashMap<>();
            body.put("nombre", solicitud.getUsuarioNombre());
            body.put("email", solicitud.getUsuarioEmail());

            // Header X-Usuario-Sub es requerido por el endpoint
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("X-Usuario-Sub", solicitud.getUsuarioSub());
            org.springframework.http.HttpEntity<Map<String, String>> entity = new org.springframework.http.HttpEntity<>(
                    body, headers);

            restTemplate.postForEntity(url, entity, Void.class);
        } catch (Exception e) {
            System.err.println("Error notificando solicitud acceso: " + e.getMessage());
            // No fallamos la transacción principal, solo logueamos
        }
    }

    public List<SolicitudAcceso> listarPendientesPorEmpresa(Long empresaId) {
        return solicitudRepository.findByEmpresaIdAndEstado(empresaId, SolicitudAcceso.EstadoSolicitud.PENDIENTE);
    }

    public SolicitudAcceso resolverSolicitud(Long solicitudId, boolean aprobar, String rol) {
        SolicitudAcceso solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        if (solicitud.getEstado() != SolicitudAcceso.EstadoSolicitud.PENDIENTE) {
            throw new RuntimeException("La solicitud no está pendiente");
        }

        if (aprobar) {
            solicitud.setEstado(SolicitudAcceso.EstadoSolicitud.APROBADA);
            // Vincular usuario a la empresa efectivamente
            usuarioService.vincularUsuarioAEmpresa(solicitud.getUsuarioSub(), solicitud.getEmpresa().getId(), rol);
        } else {
            solicitud.setEstado(SolicitudAcceso.EstadoSolicitud.RECHAZADA);
        }

        solicitud.setFechaResolucion(java.time.LocalDateTime.now());
        return solicitudRepository.save(solicitud);
    }

    public SolicitudAcceso obtenerUltimaSolicitud(String usuarioSub) {
        return solicitudRepository.findTopByUsuarioSubOrderByFechaSolicitudDesc(usuarioSub)
                .orElse(null);
    }
}
