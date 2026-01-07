package registro.mercadopago.services;
import registro.mercadopago.dtos.FacturarResponse;
import java.util.List;

public interface MpBillingService {
    FacturarResponse facturarPagos(Long userIdApp, List<Long> mpPaymentIds);
}
