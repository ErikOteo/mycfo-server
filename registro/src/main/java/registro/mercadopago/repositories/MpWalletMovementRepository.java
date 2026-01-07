package registro.mercadopago.repositories;

import registro.mercadopago.models.MpWalletMovement;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface MpWalletMovementRepository
        extends JpaRepository<MpWalletMovement, Long>, JpaSpecificationExecutor<MpWalletMovement> {

    Optional<MpWalletMovement> findByMpMovementId(String mpMovementId);

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
