package registro.mercadopago.repositories;
import registro.mercadopago.models.*;
import org.springframework.data.jpa.repository.*;

public interface MpPaymentFacturaRepository extends JpaRepository<MpPaymentFactura, Long> {
    boolean existsByMpPayment(MpPayment p);
}
