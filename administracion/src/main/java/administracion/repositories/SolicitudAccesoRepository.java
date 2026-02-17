package administracion.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import administracion.models.SolicitudAcceso;
import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitudAccesoRepository extends JpaRepository<SolicitudAcceso, Long> {

        List<SolicitudAcceso> findByEmpresaIdAndEstado(Long empresaId, SolicitudAcceso.EstadoSolicitud estado);

        Optional<SolicitudAcceso> findByUsuarioSubAndEmpresaIdAndEstado(String usuarioSub, Long empresaId,
                        SolicitudAcceso.EstadoSolicitud estado);

        boolean existsByUsuarioSubAndEmpresaIdAndEstado(String usuarioSub, Long empresaId,
                        SolicitudAcceso.EstadoSolicitud estado);

        Optional<SolicitudAcceso> findTopByUsuarioSubOrderByFechaSolicitudDesc(String usuarioSub);
}
