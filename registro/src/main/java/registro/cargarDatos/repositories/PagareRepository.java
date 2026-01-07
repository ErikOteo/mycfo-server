package registro.cargarDatos.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import registro.cargarDatos.models.Pagare;

@Repository
public interface PagareRepository extends JpaRepository<Pagare, Long> {

}
