package registro.cargarDatos.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import registro.cargarDatos.models.Factura;
import registro.cargarDatos.models.TipoMoneda;

import java.util.List;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {
    
    List<Factura> findByOrganizacionId(Long organizacionId);
    
    List<Factura> findByUsuarioId(String usuarioId);
    
    List<Factura> findByNumeroDocumento(String numeroDocumento);

    Page<Factura> findByOrganizacionId(Long organizacionId, Pageable pageable);
    Page<Factura> findByOrganizacionIdAndMoneda(Long organizacionId, TipoMoneda moneda, Pageable pageable);
    List<Factura> findByOrganizacionIdAndMoneda(Long organizacionId, TipoMoneda moneda);
    List<Factura> findByMoneda(TipoMoneda moneda);

    @Query("""
            SELECT f FROM Factura f
            WHERE (:organizacionId IS NULL OR f.organizacionId = :organizacionId)
            AND (:usuarioId IS NULL OR f.usuarioId = :usuarioId)
            AND (:desde IS NULL OR f.fechaEmision >= :desde)
            AND (:hasta IS NULL OR f.fechaEmision <= :hasta)
            AND (:tipoFactura IS NULL OR f.tipoFactura = :tipoFactura)
            AND (:estadoPago IS NULL OR f.estadoPago = :estadoPago)
            AND (:moneda IS NULL OR f.moneda = :moneda)
            """)
    Page<Factura> buscarFacturas(@Param("organizacionId") Long organizacionId,
                                 @Param("usuarioId") String usuarioId,
                                 @Param("desde") java.time.LocalDate desde,
                                 @Param("hasta") java.time.LocalDate hasta,
                                 @Param("tipoFactura") String tipoFactura,
                                 @Param("estadoPago") registro.cargarDatos.models.EstadoPago estadoPago,
                                 @Param("moneda") TipoMoneda moneda,
                                 Pageable pageable);

    @Query("""
            SELECT f FROM Factura f
            WHERE (:organizacionId IS NULL OR f.organizacionId = :organizacionId)
            AND (:usuarioId IS NULL OR f.usuarioId = :usuarioId)
            AND (:desde IS NULL OR f.fechaEmision >= :desde)
            AND (:hasta IS NULL OR f.fechaEmision <= :hasta)
            AND (:tipoFactura IS NULL OR f.tipoFactura = :tipoFactura)
            AND (:estadoPago IS NULL OR f.estadoPago = :estadoPago)
            AND (:moneda IS NULL OR f.moneda = :moneda)
            """)
    List<Factura> buscarFacturas(@Param("organizacionId") Long organizacionId,
                                 @Param("usuarioId") String usuarioId,
                                 @Param("desde") java.time.LocalDate desde,
                                 @Param("hasta") java.time.LocalDate hasta,
                                 @Param("tipoFactura") String tipoFactura,
                                 @Param("estadoPago") registro.cargarDatos.models.EstadoPago estadoPago,
                                 @Param("moneda") TipoMoneda moneda);
}
