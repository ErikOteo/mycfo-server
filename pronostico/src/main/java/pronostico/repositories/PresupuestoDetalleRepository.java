package pronostico.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pronostico.models.PresupuestoDetalle;

import java.util.List;
import java.util.Optional;

public interface PresupuestoDetalleRepository extends JpaRepository<PresupuestoDetalle, Long> {
  List<PresupuestoDetalle> findByPresupuestoId(Long presupuestoId);

  Optional<PresupuestoDetalle> findByIdAndPresupuestoId(Long detalleId, Long presupuestoId);

  @Modifying
  @Query("DELETE FROM PresupuestoDetalle pd WHERE pd.presupuesto.id IN :presupuestoIds")
  void deleteByPresupuestoIds(@Param("presupuestoIds") List<Long> presupuestoIds);
}
