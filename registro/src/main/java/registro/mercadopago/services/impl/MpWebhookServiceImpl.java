package registro.mercadopago.services.impl;

import registro.mercadopago.services.MpWebhookService;
import org.springframework.stereotype.Service;

@Service
public class MpWebhookServiceImpl implements MpWebhookService {
    @Override public void handle(String signature, String body) {
        // TODO: validar firma y reimportar/actualizar pagos
    }
}
