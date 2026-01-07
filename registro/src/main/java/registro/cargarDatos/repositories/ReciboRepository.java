package registro.cargarDatos.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import registro.cargarDatos.models.Recibo;

@Repository
public interface ReciboRepository extends JpaRepository<Recibo, Long> {

}
