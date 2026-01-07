package registro.mercadopago.repositories;
import registro.mercadopago.models.*;
import org.springframework.data.jpa.repository.*;
import java.util.Optional;

public interface MpAccountLinkRepository extends JpaRepository<MpAccountLink, Long> {
    Optional<MpAccountLink> findByUserIdApp(Long userIdApp);
}

