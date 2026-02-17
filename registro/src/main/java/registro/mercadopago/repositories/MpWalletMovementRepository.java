package registro.mercadopago.repositories;

import registro.mercadopago.models.MpWalletMovement;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.time.Instant;
import java.util.List;

@Repository
public interface MpWalletMovementRepository
        extends JpaRepository<MpWalletMovement, Long>, JpaSpecificationExecutor<MpWalletMovement> {

    Optional<MpWalletMovement> findByMpMovementId(String mpMovementId);

    @Query("""
        select m from MpWalletMovement m
        where m.accountLink.userIdApp = :userIdApp
          and m.dateEvent >= :fromInclusive
          and m.dateEvent < :toExclusive
        order by m.dateEvent desc
    """)
    List<MpWalletMovement> findByUserIdAppAndDateEventBetween(
            @Param("userIdApp") String userIdApp,
            @Param("fromInclusive") Instant fromInclusive,
            @Param("toExclusive") Instant toExclusive
    );

    @Query("""
        select m from MpWalletMovement m
        where m.accountLink.userIdApp = :userIdApp
          and (
                (m.dateEvent >= :fromInclusive and m.dateEvent < :toExclusive)
                or
                (m.dateEvent is null and m.importedAt >= :importStartedAt)
              )
        order by m.dateEvent desc, m.importedAt desc
    """)
    List<MpWalletMovement> findImportablesForMonth(
            @Param("userIdApp") String userIdApp,
            @Param("fromInclusive") Instant fromInclusive,
            @Param("toExclusive") Instant toExclusive,
            @Param("importStartedAt") Instant importStartedAt
    );

    /**
     * Borra todos los movimientos de billetera de un link.
     */
    @Modifying
    @Transactional
    @Query("""
        delete from MpWalletMovement m
        where m.accountLink.id = :linkId
    """)
    int deleteByAccountLinkId(@Param("linkId") Long linkId);
}
