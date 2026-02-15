package registro.mercadopago.services;
import registro.mercadopago.dtos.OauthStatusDTO;
import registro.mercadopago.models.MpAccountLink;

public interface MpAuthService {
    String buildAuthorizationUrl(String state, String userIdApp);
    OauthStatusDTO getStatus(String userIdApp);
    void handleCallback(String code, String state, String userIdApp);
    void unlink(String userIdApp);
    MpAccountLink getAccountLink(String userIdApp);
}
