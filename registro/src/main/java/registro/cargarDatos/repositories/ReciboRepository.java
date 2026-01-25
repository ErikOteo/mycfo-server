package registro.cargarDatos.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import registro.cargarDatos.models.Recibo;
import registro.cargarDatos.models.TipoMoneda;

import java.util.List;

@Repository
public interface ReciboRepository extends JpaRepository<Recibo, Long> {

    List<Recibo> findByMoneda(TipoMoneda moneda);
}
