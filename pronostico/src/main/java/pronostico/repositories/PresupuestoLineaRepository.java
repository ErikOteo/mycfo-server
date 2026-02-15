package pronostico.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pronostico.models.PresupuestoLinea;

import java.util.List;

public interface PresupuestoLineaRepository extends JpaRepository<PresupuestoLinea, Long> {
  List<PresupuestoLinea> findByPresupuesto_Id(Long presupuestoId);
  List<PresupuestoLinea> findByPresupuesto_IdAndMes(Long presupuestoId, String mes);

  @Modifying
  @Query("DELETE FROM PresupuestoLinea pl WHERE pl.presupuesto.id IN :presupuestoIds")
  void deleteByPresupuestoIds(@Param("presupuestoIds") List<Long> presupuestoIds);

  @Query("SELECT COALESCE(SUM(pl.montoEstimado),0) FROM PresupuestoLinea pl WHERE pl.presupuesto.id = :presupuestoId AND pl.tipo = 'EGRESO'")
  java.math.BigDecimal sumEstimadoEgreso(@Param("presupuestoId") Long presupuestoId);

  @Query("SELECT COALESCE(SUM(pl.montoReal),0) FROM PresupuestoLinea pl WHERE pl.presupuesto.id = :presupuestoId AND pl.tipo = 'EGRESO'")
  java.math.BigDecimal sumRealEgreso(@Param("presupuestoId") Long presupuestoId);
}
