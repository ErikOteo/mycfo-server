package pronostico.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pronostico.models.Presupuesto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {

    // --- Scoped por organizacion ---
    List<Presupuesto> findByOrganizacionId(Long organizacionId);

    Page<Presupuesto> findByOrganizacionId(Long organizacionId, Pageable pageable);

    List<Presupuesto> findByOrganizacionIdAndDeletedFalse(Long organizacionId);

    Page<Presupuesto> findByOrganizacionIdAndDeletedFalse(Long organizacionId, Pageable pageable);

    List<Presupuesto> findByOrganizacionIdAndDeletedTrue(Long organizacionId);

    Page<Presupuesto> findByOrganizacionIdAndDeletedTrue(Long organizacionId, Pageable pageable);

    boolean existsByIdAndOrganizacionId(Long id, Long organizacionId);

    Optional<Presupuesto> findByIdAndOrganizacionId(Long id, Long organizacionId);

    Optional<Presupuesto> findByIdAndOrganizacionIdAndDeletedFalse(Long id, Long organizacionId);

    List<Presupuesto> findTop100ByOrganizacionIdIsNullOrderByIdAsc();

    @Query("""
        SELECT p FROM Presupuesto p
         WHERE p.organizacionId = :organizacionId
           AND FUNCTION('STR_TO_DATE', p.desde, '%Y-%m-%d') <= :hoy
           AND FUNCTION('STR_TO_DATE', p.hasta, '%Y-%m-%d') >= :hoy
           AND p.deleted = false
         ORDER BY p.desde DESC, p.hasta DESC, p.id DESC
    """)
    List<Presupuesto> findCurrentByOrganizacionId(
        @Param("organizacionId") Long organizacionId,
        @Param("hoy") LocalDate hoy
    );

    @Query(
        value = """
            SELECT p FROM Presupuesto p
             WHERE p.organizacionId = :organizacionId
               AND FUNCTION('STR_TO_DATE', p.desde, '%Y-%m-%d') <= :to
               AND FUNCTION('STR_TO_DATE', p.hasta, '%Y-%m-%d') >= :from
               AND (
                    :status = 'all'
                 OR (:status = 'active' AND p.deleted = false)
                 OR (:status = 'deleted' AND p.deleted = true)
               )
               AND (
                    :moneda IS NULL
                 OR (UPPER(:moneda) = 'USD' AND LOWER(TRIM(p.nombre)) LIKE '[usd]%')
                 OR (UPPER(:moneda) = 'ARS' AND (
                        LOWER(TRIM(p.nombre)) LIKE '[ars]%'
                        OR (LOWER(TRIM(p.nombre)) NOT LIKE '[usd]%' AND LOWER(TRIM(p.nombre)) NOT LIKE '[ars]%')
                    ))
               )
        """,
        countQuery = """
            SELECT COUNT(p) FROM Presupuesto p
             WHERE p.organizacionId = :organizacionId
               AND FUNCTION('STR_TO_DATE', p.desde, '%Y-%m-%d') <= :to
               AND FUNCTION('STR_TO_DATE', p.hasta, '%Y-%m-%d') >= :from
               AND (
                    :status = 'all'
                 OR (:status = 'active' AND p.deleted = false)
                 OR (:status = 'deleted' AND p.deleted = true)
               )
               AND (
                    :moneda IS NULL
                 OR (UPPER(:moneda) = 'USD' AND LOWER(TRIM(p.nombre)) LIKE '[usd]%')
                 OR (UPPER(:moneda) = 'ARS' AND (
                        LOWER(TRIM(p.nombre)) LIKE '[ars]%'
                        OR (LOWER(TRIM(p.nombre)) NOT LIKE '[usd]%' AND LOWER(TRIM(p.nombre)) NOT LIKE '[ars]%')
                    ))
               )
        """
    )
    Page<Presupuesto> searchByOrganizacion(
        @Param("organizacionId") Long organizacionId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("status") String status,
        @Param("moneda") String moneda,
        Pageable pageable
    );

    @Query(
        value = """
            SELECT p FROM Presupuesto p
             WHERE p.organizacionId = :organizacionId
               AND (
                    :status = 'all'
                 OR (:status = 'active' AND p.deleted = false)
                 OR (:status = 'deleted' AND p.deleted = true)
               )
               AND (
                    :moneda IS NULL
                 OR (UPPER(:moneda) = 'USD' AND LOWER(TRIM(p.nombre)) LIKE '[usd]%')
                 OR (UPPER(:moneda) = 'ARS' AND (
                        LOWER(TRIM(p.nombre)) LIKE '[ars]%'
                        OR (LOWER(TRIM(p.nombre)) NOT LIKE '[usd]%' AND LOWER(TRIM(p.nombre)) NOT LIKE '[ars]%')
                    ))
               )
        """,
        countQuery = """
            SELECT COUNT(p) FROM Presupuesto p
             WHERE p.organizacionId = :organizacionId
               AND (
                    :status = 'all'
                 OR (:status = 'active' AND p.deleted = false)
                 OR (:status = 'deleted' AND p.deleted = true)
               )
               AND (
                    :moneda IS NULL
                 OR (UPPER(:moneda) = 'USD' AND LOWER(TRIM(p.nombre)) LIKE '[usd]%')
                 OR (UPPER(:moneda) = 'ARS' AND (
                        LOWER(TRIM(p.nombre)) LIKE '[ars]%'
                        OR (LOWER(TRIM(p.nombre)) NOT LIKE '[usd]%' AND LOWER(TRIM(p.nombre)) NOT LIKE '[ars]%')
                    ))
               )
        """
    )
    Page<Presupuesto> listByOrganizacionStatusAndMoneda(
        @Param("organizacionId") Long organizacionId,
        @Param("status") String status,
        @Param("moneda") String moneda,
        Pageable pageable
    );

    @Query("""
        SELECT p FROM Presupuesto p
         WHERE p.organizacionId = :organizacionId
           AND p.desde <= :to
           AND p.hasta >= :from
           AND p.deleted = false
    """)
    Page<Presupuesto> findActiveOverlappingByOrganizacionId(
        @Param("organizacionId") Long organizacionId,
        @Param("from") String from,
        @Param("to") String to,
        Pageable pageable
    );

    @Query("""
        SELECT p FROM Presupuesto p
         WHERE p.organizacionId = :organizacionId
           AND p.desde <= :to
           AND p.hasta >= :from
           AND p.deleted = false
    """)
    List<Presupuesto> findActiveOverlappingByOrganizacionId(
        @Param("organizacionId") Long organizacionId,
        @Param("from") String from,
        @Param("to") String to
    );

    @Query("""
        SELECT p FROM Presupuesto p
         WHERE p.organizacionId = :organizacionId
           AND p.desde <= :to
           AND p.hasta >= :from
           AND p.deleted = true
    """)
    Page<Presupuesto> findDeletedOverlappingByOrganizacionId(
        @Param("organizacionId") Long organizacionId,
        @Param("from") String from,
        @Param("to") String to,
        Pageable pageable
    );

    @Query("""
        SELECT p FROM Presupuesto p
         WHERE p.organizacionId = :organizacionId
           AND p.desde <= :to
           AND p.hasta >= :from
           AND p.deleted = true
    """)
    List<Presupuesto> findDeletedOverlappingByOrganizacionId(
        @Param("organizacionId") Long organizacionId,
        @Param("from") String from,
        @Param("to") String to
    );

    @Query("""
        SELECT p FROM Presupuesto p
         WHERE p.organizacionId = :organizacionId
           AND p.desde <= :to
           AND p.hasta >= :from
    """)
    Page<Presupuesto> findAnyOverlappingByOrganizacionId(
        @Param("organizacionId") Long organizacionId,
        @Param("from") String from,
        @Param("to") String to,
        Pageable pageable
    );

    @Query("""
        SELECT p FROM Presupuesto p
         WHERE p.organizacionId = :organizacionId
           AND p.desde <= :to
           AND p.hasta >= :from
    """)
    List<Presupuesto> findAnyOverlappingByOrganizacionId(
        @Param("organizacionId") Long organizacionId,
        @Param("from") String from,
        @Param("to") String to
    );

    // --- Compatibilidad por owner (mantener hasta refactor completo) ---
    List<Presupuesto> findByOwnerSub(String ownerSub);

    Page<Presupuesto> findByOwnerSub(String ownerSub, Pageable pageable);

    List<Presupuesto> findByOwnerSubAndDeletedFalse(String ownerSub);

    Page<Presupuesto> findByOwnerSubAndDeletedFalse(String ownerSub, Pageable pageable);

    List<Presupuesto> findByOwnerSubAndDeletedTrue(String ownerSub);

    Page<Presupuesto> findByOwnerSubAndDeletedTrue(String ownerSub, Pageable pageable);

    boolean existsByIdAndOwnerSub(Long id, String ownerSub);

    Optional<Presupuesto> findByIdAndOwnerSub(Long id, String ownerSub);

    Optional<Presupuesto> findByIdAndOwnerSubAndDeletedFalse(Long id, String ownerSub);

    @Query("SELECT p FROM Presupuesto p WHERE p.ownerSub = :ownerSub AND p.desde <= :to AND p.hasta >= :from AND p.deleted = false")
    List<Presupuesto> findActiveOverlapping(
        @Param("ownerSub") String ownerSub,
        @Param("from") String from,
        @Param("to") String to
    );

    @Query(
        value = "SELECT p FROM Presupuesto p WHERE p.ownerSub = :ownerSub AND p.desde <= :to AND p.hasta >= :from AND p.deleted = false",
        countQuery = "SELECT COUNT(p) FROM Presupuesto p WHERE p.ownerSub = :ownerSub AND p.desde <= :to AND p.hasta >= :from AND p.deleted = false"
    )
    Page<Presupuesto> findActiveOverlapping(
        @Param("ownerSub") String ownerSub,
        @Param("from") String from,
        @Param("to") String to,
        Pageable pageable
    );

    @Query("SELECT p FROM Presupuesto p WHERE p.ownerSub = :ownerSub AND p.desde <= :to AND p.hasta >= :from AND p.deleted = true")
    List<Presupuesto> findDeletedOverlapping(
        @Param("ownerSub") String ownerSub,
        @Param("from") String from,
        @Param("to") String to
    );

    @Query(
        value = "SELECT p FROM Presupuesto p WHERE p.ownerSub = :ownerSub AND p.desde <= :to AND p.hasta >= :from AND p.deleted = true",
        countQuery = "SELECT COUNT(p) FROM Presupuesto p WHERE p.ownerSub = :ownerSub AND p.desde <= :to AND p.hasta >= :from AND p.deleted = true"
    )
    Page<Presupuesto> findDeletedOverlapping(
        @Param("ownerSub") String ownerSub,
        @Param("from") String from,
        @Param("to") String to,
        Pageable pageable
    );

    @Query("SELECT p FROM Presupuesto p WHERE p.ownerSub = :ownerSub AND p.desde <= :to AND p.hasta >= :from")
    List<Presupuesto> findAnyOverlapping(
        @Param("ownerSub") String ownerSub,
        @Param("from") String from,
        @Param("to") String to
    );

    @Query(
        value = "SELECT p FROM Presupuesto p WHERE p.ownerSub = :ownerSub AND p.desde <= :to AND p.hasta >= :from",
        countQuery = "SELECT COUNT(p) FROM Presupuesto p WHERE p.ownerSub = :ownerSub AND p.desde <= :to AND p.hasta >= :from"
    )
    Page<Presupuesto> findAnyOverlapping(
        @Param("ownerSub") String ownerSub,
        @Param("from") String from,
        @Param("to") String to,
        Pageable pageable
    );

    @Query("SELECT p.id FROM Presupuesto p WHERE p.deleted = true AND p.deletedAt < :cutoff")
    List<Long> findIdsDeletedBefore(@Param("cutoff") LocalDateTime cutoff);

    @Modifying(clearAutomatically = true)
    @Query("""
        update Presupuesto p
           set p.deleted = true,
               p.deletedAt = :deletedAt,
               p.deletedBy = :deletedBy
        where p.id = :id
          and p.organizacionId = :organizacionId
          and p.deleted = false
        """)
    int markDeletedIfActive(@Param("id") Long id,
                            @Param("organizacionId") Long organizacionId,
                            @Param("deletedAt") LocalDateTime deletedAt,
                            @Param("deletedBy") String deletedBy);
}
