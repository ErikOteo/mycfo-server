package registro.mercadopago.services.impl;

import registro.mercadopago.dtos.FacturarResponse;
import registro.mercadopago.services.MpBillingService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MpBillingServiceImpl implements MpBillingService {
    @Override
    public FacturarResponse facturarPagos(String userIdApp, List<Long> mpPaymentIds) {
        // TODO: integrar con tu FacturaService; por ahora respondemos "0 creadas"
        return new FacturarResponse(0, mpPaymentIds == null ? 0 : mpPaymentIds.size());
    }
}
