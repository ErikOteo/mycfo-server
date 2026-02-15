package administracion.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import administracion.models.Empresa;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmpresaRepository extends JpaRepository<Empresa, Long> {
    Optional<Empresa> findByNombreIgnoreCase(String nombre);

    // Búsqueda parcial para el autocompletado/buscador
    List<Empresa> findByNombreContainingIgnoreCase(String nombre);
}
