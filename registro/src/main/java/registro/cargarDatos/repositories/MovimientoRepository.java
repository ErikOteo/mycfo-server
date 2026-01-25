package registro.cargarDatos.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import registro.cargarDatos.models.Movimiento;
import registro.cargarDatos.models.TipoMoneda;
import registro.cargarDatos.models.TipoMovimiento;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimientoRepository extends JpaRepository<Movimiento, Long>, JpaSpecificationExecutor<Movimiento> {

    // Buscar por organización
    List<Movimiento> findByOrganizacionId(Long organizacionId);

    // Buscar por tipo
    List<Movimiento> findByTipo(TipoMovimiento tipo);

    // Buscar por tipo y organización
    List<Movimiento> findByTipoAndOrganizacionId(TipoMovimiento tipo, Long organizacionId);

    // Buscar por rango de fechas (fechaEmision con fecha y hora)
    List<Movimiento> findByFechaEmisionBetween(LocalDateTime inicio, LocalDateTime fin);

    // Buscar por fecha emision
    List<Movimiento> findByFechaEmisionIn(java.util.Set<LocalDateTime> fechas);

    List<Movimiento> findByOrganizacionIdAndFechaEmisionIn(Long organizacionId, java.util.Set<LocalDateTime> fechas);

    // Buscar por organización y rango de fechas
    List<Movimiento> findByOrganizacionIdAndFechaEmisionBetween(Long organizacionId, LocalDateTime inicio, LocalDateTime fin);
    List<Movimiento> findByOrganizacionIdAndFechaEmisionBetweenAndMoneda(Long organizacionId, LocalDateTime inicio, LocalDateTime fin, TipoMoneda moneda);

    List<Movimiento> findByOrganizacionIdAndUsuarioIdAndTipoAndFechaEmisionBetween(
            Long organizacionId,
            String usuarioId,
            TipoMovimiento tipo,
            LocalDateTime inicio,
            LocalDateTime fin
    );

    @Query("SELECT COALESCE(SUM(m.montoTotal), 0) FROM Movimiento m " +
            "WHERE (:organizacionId IS NULL OR m.organizacionId = :organizacionId) " +
            "AND (:usuarioId IS NULL OR m.usuarioId = :usuarioId) " +
            "AND (:moneda IS NULL OR m.moneda = :moneda) " +
            "AND m.tipo = :tipo " +
            "AND m.fechaEmision BETWEEN :inicio AND :fin")
    Double sumMontoByOrganizacionOrUsuarioAndTipoAndFechaBetween(
            @Param("organizacionId") Long organizacionId,
            @Param("usuarioId") String usuarioId,
            @Param("moneda") TipoMoneda moneda,
            @Param("tipo") TipoMovimiento tipo,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT COUNT(m) FROM Movimiento m " +
            "WHERE (:organizacionId IS NULL OR m.organizacionId = :organizacionId) " +
            "AND (:usuarioId IS NULL OR m.usuarioId = :usuarioId) " +
            "AND (:moneda IS NULL OR m.moneda = :moneda) " +
            "AND m.fechaEmision BETWEEN :inicio AND :fin")
    long countByOrganizacionOrUsuarioAndFechaEmisionBetween(
            @Param("organizacionId") Long organizacionId,
            @Param("usuarioId") String usuarioId,
            @Param("moneda") TipoMoneda moneda,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT COUNT(m) FROM Movimiento m " +
            "WHERE (:organizacionId IS NULL OR m.organizacionId = :organizacionId) " +
            "AND (:usuarioId IS NULL OR m.usuarioId = :usuarioId) " +
            "AND (:moneda IS NULL OR m.moneda = :moneda) " +
            "AND m.fechaEmision BETWEEN :inicio AND :fin " +
            "AND m.documentoComercial IS NOT NULL")
    long countConciliadosByOrganizacionOrUsuarioAndFechaEmisionBetween(
            @Param("organizacionId") Long organizacionId,
            @Param("usuarioId") String usuarioId,
            @Param("moneda") TipoMoneda moneda,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT COUNT(m) FROM Movimiento m " +
            "WHERE (:organizacionId IS NULL OR m.organizacionId = :organizacionId) " +
            "AND (:usuarioId IS NULL OR m.usuarioId = :usuarioId) " +
            "AND (:moneda IS NULL OR m.moneda = :moneda) " +
            "AND m.fechaEmision BETWEEN :inicio AND :fin " +
            "AND m.documentoComercial IS NULL")
    long countPendientesByOrganizacionOrUsuarioAndFechaEmisionBetween(
            @Param("organizacionId") Long organizacionId,
            @Param("usuarioId") String usuarioId,
            @Param("moneda") TipoMoneda moneda,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT MAX(COALESCE(m.fechaActualizacion, m.fechaEmision)) FROM Movimiento m " +
            "WHERE (:organizacionId IS NULL OR m.organizacionId = :organizacionId) " +
            "AND (:usuarioId IS NULL OR m.usuarioId = :usuarioId) " +
            "AND (:moneda IS NULL OR m.moneda = :moneda) " +
            "AND m.fechaEmision BETWEEN :inicio AND :fin " +
            "AND m.documentoComercial IS NOT NULL")
    LocalDateTime findUltimaConciliacion(
            @Param("organizacionId") Long organizacionId,
            @Param("usuarioId") String usuarioId,
            @Param("moneda") TipoMoneda moneda,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT MAX(m.fechaEmision) FROM Movimiento m " +
            "WHERE (:organizacionId IS NULL OR m.organizacionId = :organizacionId) " +
            "AND (:usuarioId IS NULL OR m.usuarioId = :usuarioId) " +
            "AND (:moneda IS NULL OR m.moneda = :moneda) " +
            "AND m.fechaEmision BETWEEN :inicio AND :fin " +
            "AND m.documentoComercial IS NULL")
    LocalDateTime findUltimoMovimientoPendiente(
            @Param("organizacionId") Long organizacionId,
            @Param("usuarioId") String usuarioId,
            @Param("moneda") TipoMoneda moneda,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT m.tipo, COUNT(m), SUM(CASE WHEN m.documentoComercial IS NOT NULL THEN 1 ELSE 0 END), " +
            "SUM(m.montoTotal), " +
            "SUM(CASE WHEN m.documentoComercial IS NOT NULL THEN m.montoTotal ELSE 0 END), " +
            "SUM(CASE WHEN m.documentoComercial IS NULL THEN m.montoTotal ELSE 0 END) " +
            "FROM Movimiento m " +
            "WHERE (:organizacionId IS NULL OR m.organizacionId = :organizacionId) " +
            "AND (:usuarioId IS NULL OR m.usuarioId = :usuarioId) " +
            "AND (:moneda IS NULL OR m.moneda = :moneda) " +
            "AND m.fechaEmision BETWEEN :inicio AND :fin " +
            "GROUP BY m.tipo")
    List<Object[]> obtenerResumenConciliacionPorTipo(
            @Param("organizacionId") Long organizacionId,
            @Param("usuarioId") String usuarioId,
            @Param("moneda") TipoMoneda moneda,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    // Query optimizada para obtener movimientos con filtros (reemplaza findAll + filtros en memoria)
    @Query("SELECT m FROM Movimiento m " +
           "WHERE (:organizacionId IS NULL OR m.organizacionId = :organizacionId) " +
           "AND (:usuarioId IS NULL OR m.usuarioId = :usuarioId) " +
           "AND (:fechaDesde IS NULL OR m.fechaEmision >= :fechaDesde) " +
           "AND (:fechaHasta IS NULL OR m.fechaEmision <= :fechaHasta) " +
           "AND (:tipos IS NULL OR m.tipo IN :tipos) " +
           "AND (:moneda IS NULL OR m.moneda = :moneda) " +
           "AND (:conciliado IS NULL OR " +
           "     (CASE WHEN :conciliado = true THEN m.documentoComercial IS NOT NULL " +
           "           ELSE m.documentoComercial IS NULL END)) " +
           "AND (:nombreRelacionado IS NULL OR " +
           "     LOWER(m.origenNombre) LIKE LOWER(CONCAT('%', :nombreRelacionado, '%')) OR " +
           "     LOWER(m.destinoNombre) LIKE LOWER(CONCAT('%', :nombreRelacionado, '%')) OR " +
           "     LOWER(m.descripcion) LIKE LOWER(CONCAT('%', :nombreRelacionado, '%'))) " +
           "AND (:search IS NULL OR " +
           "     LOWER(COALESCE(m.origenNombre, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(m.destinoNombre, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(m.descripcion, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(m.categoria, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(m.origenCuit, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(COALESCE(m.destinoCuit, '')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:searchDate IS NULL OR DATE(m.fechaEmision) = :searchDate)")
    org.springframework.data.domain.Page<Movimiento> findMovimientosConFiltros(
            @Param("organizacionId") Long organizacionId,
            @Param("usuarioId") String usuarioId,
            @Param("fechaDesde") LocalDateTime fechaDesde,
            @Param("fechaHasta") LocalDateTime fechaHasta,
            @Param("tipos") List<TipoMovimiento> tipos,
            @Param("moneda") TipoMoneda moneda,
            @Param("conciliado") Boolean conciliado,
            @Param("nombreRelacionado") String nombreRelacionado,
            @Param("search") String search,
            @Param("searchDate") java.time.LocalDate searchDate,
            org.springframework.data.domain.Pageable pageable
    );

    // Query optimizada para sumar montos por categoría (reemplaza findAll + groupBy en memoria)
    @Query("SELECT COALESCE(m.categoria, 'Sin categoria'), SUM(m.montoTotal) " +
           "FROM Movimiento m " +
           "WHERE m.organizacionId = :organizacionId " +
            "AND m.tipo = :tipo " +
            "AND (:moneda IS NULL OR m.moneda = :moneda) " +
           "AND m.fechaEmision BETWEEN :inicio AND :fin " +
           "GROUP BY m.categoria " +
            "ORDER BY SUM(m.montoTotal) DESC")
    List<Object[]> sumMontosPorCategoria(
            @Param("organizacionId") Long organizacionId,
            @Param("tipo") TipoMovimiento tipo,
            @Param("moneda") TipoMoneda moneda,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    // Métodos para conciliación con paginación
    List<Movimiento> findByDocumentoComercialIsNull();
    Page<Movimiento> findByDocumentoComercialIsNull(Pageable pageable);
    
    List<Movimiento> findByDocumentoComercialIsNotNull();
    Page<Movimiento> findByDocumentoComercialIsNotNull(Pageable pageable);

    // Métodos filtrados por moneda para conciliación
    Page<Movimiento> findByDocumentoComercialIsNullAndMoneda(TipoMoneda moneda, Pageable pageable);
    List<Movimiento> findByDocumentoComercialIsNullAndMoneda(TipoMoneda moneda);
    Page<Movimiento> findByMoneda(TipoMoneda moneda, Pageable pageable);
    List<Movimiento> findByMoneda(TipoMoneda moneda);

    // Métodos filtrados por empresa (multi-tenant)
    Page<Movimiento> findByOrganizacionId(Long organizacionId, Pageable pageable);
    List<Movimiento> findByOrganizacionId(Long organizacionId);

    Page<Movimiento> findByOrganizacionIdAndMoneda(Long organizacionId, TipoMoneda moneda, Pageable pageable);
    List<Movimiento> findByOrganizacionIdAndMoneda(Long organizacionId, TipoMoneda moneda);

    Page<Movimiento> findByOrganizacionIdAndDocumentoComercialIsNull(Long organizacionId, Pageable pageable);
    List<Movimiento> findByOrganizacionIdAndDocumentoComercialIsNull(Long organizacionId);

    Page<Movimiento> findByOrganizacionIdAndDocumentoComercialIsNullAndMoneda(Long organizacionId, TipoMoneda moneda, Pageable pageable);
    List<Movimiento> findByOrganizacionIdAndDocumentoComercialIsNullAndMoneda(Long organizacionId, TipoMoneda moneda);
}
