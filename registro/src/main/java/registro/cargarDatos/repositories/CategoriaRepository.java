package registro.cargarDatos.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import registro.cargarDatos.models.Categoria;
import registro.cargarDatos.models.TipoMovimiento;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    List<Categoria> findByOrganizacionIdAndActivoTrue(Long organizacionId);

    @Query("SELECT c FROM Categoria c WHERE c.organizacionId = :orgId AND c.activo = true AND (c.tipo = :tipo OR c.tipo IS NULL)")
    List<Categoria> findActivasPorOrgYTipo(@Param("orgId") Long organizacionId, @Param("tipo") TipoMovimiento tipo);

    Optional<Categoria> findFirstByOrganizacionIdAndNombreIgnoreCaseAndActivoTrue(Long organizacionId, String nombre);
}
