package registro.cargarDatos.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import registro.cargarDatos.models.Factura;

import java.util.List;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {
    
    List<Factura> findByOrganizacionId(Long organizacionId);
    
    List<Factura> findByUsuarioId(String usuarioId);
    
    List<Factura> findByNumeroDocumento(String numeroDocumento);

    Page<Factura> findByOrganizacionId(Long organizacionId, Pageable pageable);

    @Query("""
            SELECT f FROM Factura f
            WHERE (:organizacionId IS NULL OR f.organizacionId = :organizacionId)
            AND (:usuarioId IS NULL OR f.usuarioId = :usuarioId)
            AND (:desde IS NULL OR f.fechaEmision >= :desde)
            AND (:hasta IS NULL OR f.fechaEmision <= :hasta)
            AND (:tipoFactura IS NULL OR f.tipoFactura = :tipoFactura)
            AND (:estadoPago IS NULL OR f.estadoPago = :estadoPago)
            AND (:search IS NULL OR
                 LOWER(f.numeroDocumento) LIKE LOWER(CONCAT('%', :search, '%')) OR
                 LOWER(COALESCE(f.tipoFactura, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                 LOWER(COALESCE(f.vendedorNombre, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                 LOWER(COALESCE(f.compradorNombre, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                 LOWER(COALESCE(f.vendedorCuit, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                 LOWER(COALESCE(f.compradorCuit, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                 )
            AND (:searchDate IS NULL OR DATE(f.fechaEmision) = :searchDate)
            """)
    Page<Factura> buscarFacturas(@Param("organizacionId") Long organizacionId,
                                 @Param("usuarioId") String usuarioId,
                                 @Param("desde") java.time.LocalDateTime desde,
                                 @Param("hasta") java.time.LocalDateTime hasta,
                                 @Param("tipoFactura") String tipoFactura,
                                 @Param("estadoPago") registro.cargarDatos.models.EstadoPago estadoPago,
                                 @Param("search") String search,
                                 @Param("searchDate") java.time.LocalDate searchDate,
                                 Pageable pageable);

    @Query("""
            SELECT f FROM Factura f
            WHERE (:organizacionId IS NULL OR f.organizacionId = :organizacionId)
            AND (:usuarioId IS NULL OR f.usuarioId = :usuarioId)
            AND (:desde IS NULL OR f.fechaEmision >= :desde)
            AND (:hasta IS NULL OR f.fechaEmision <= :hasta)
            AND (:tipoFactura IS NULL OR f.tipoFactura = :tipoFactura)
            AND (:estadoPago IS NULL OR f.estadoPago = :estadoPago)
            AND (:search IS NULL OR
                 LOWER(f.numeroDocumento) LIKE LOWER(CONCAT('%', :search, '%')) OR
                 LOWER(COALESCE(f.tipoFactura, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                 LOWER(COALESCE(f.vendedorNombre, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                 LOWER(COALESCE(f.compradorNombre, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                 LOWER(COALESCE(f.vendedorCuit, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                 LOWER(COALESCE(f.compradorCuit, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                 )
            AND (:searchDate IS NULL OR DATE(f.fechaEmision) = :searchDate)
            """)
    List<Factura> buscarFacturas(@Param("organizacionId") Long organizacionId,
                                 @Param("usuarioId") String usuarioId,
                                 @Param("desde") java.time.LocalDateTime desde,
                                 @Param("hasta") java.time.LocalDateTime hasta,
                                 @Param("tipoFactura") String tipoFactura,
                                 @Param("estadoPago") registro.cargarDatos.models.EstadoPago estadoPago,
                                 @Param("search") String search,
                                 @Param("searchDate") java.time.LocalDate searchDate);
}
