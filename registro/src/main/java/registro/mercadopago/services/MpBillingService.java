package registro.mercadopago.services;
import registro.mercadopago.dtos.FacturarResponse;
import java.util.List;

public interface MpBillingService {
    FacturarResponse facturarPagos(String userIdApp, List<Long> mpPaymentIds);
}
