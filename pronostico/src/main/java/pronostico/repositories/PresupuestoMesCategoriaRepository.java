package pronostico.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pronostico.models.PresupuestoMesCategoria;

import java.util.List;

public interface PresupuestoMesCategoriaRepository extends JpaRepository<PresupuestoMesCategoria, Long> {
  List<PresupuestoMesCategoria> findByPresupuestoDetalleId(Long detalleId);

  @Modifying
  @Query("DELETE FROM PresupuestoMesCategoria pmc WHERE pmc.presupuestoDetalle.presupuesto.id IN :presupuestoIds")
  void deleteByPresupuestoIds(@Param("presupuestoIds") List<Long> presupuestoIds);
}
