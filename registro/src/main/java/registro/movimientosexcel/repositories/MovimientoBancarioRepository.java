package registro.movimientosexcel.repositories;

import registro.movimientosexcel.models.MovimientoBancario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MovimientoBancarioRepository extends JpaRepository<MovimientoBancario, Long> {
    Optional<MovimientoBancario> findByOrigenAndIdReferencia(MovimientoBancario.OrigenMovimiento origen, String idReferencia);
}
