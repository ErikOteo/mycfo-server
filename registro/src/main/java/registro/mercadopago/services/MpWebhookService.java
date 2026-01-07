package registro.mercadopago.services;
public interface MpWebhookService {
    void handle(String signature, String body);
}
