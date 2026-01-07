package registro.mercadopago.repositories;

import registro.mercadopago.models.MpPayment;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface MpPaymentRepository extends JpaRepository<MpPayment, Long>, JpaSpecificationExecutor<MpPayment> {

    Optional<MpPayment> findByMpPaymentId(Long mpPaymentId);

    /**
     * Borra todos los pagos de un link que NO están facturados.
     * "Facturado" = existe MpPaymentFactura pf con pf.payment.id = p.id
     */
    @Modifying
    @Transactional
    @Query("""
        delete from MpPayment p
        where p.accountLink.id = :linkId
          and not exists (
            select 1 from MpPaymentFactura pf
            where pf.mpPayment.id = p.id
          )
    """)
    int deleteNotInvoicedByLink(@Param("linkId") Long linkId);

    /**
     * Desasocia (SET NULL) los pagos facturados para poder borrar el link sin violar FKs.
     */
    @Modifying
    @Transactional
    @Query("""
        update MpPayment p
        set p.accountLink = null
        where p.accountLink.id = :linkId
          and exists (
            select 1 from MpPaymentFactura pf
            where pf.mpPayment.id = p.id
          )
    """)
    int detachInvoicedByLink(@Param("linkId") Long linkId);
}
