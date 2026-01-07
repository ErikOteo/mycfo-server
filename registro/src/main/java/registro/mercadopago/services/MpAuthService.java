package registro.mercadopago.services;
import registro.mercadopago.dtos.OauthStatusDTO;
import registro.mercadopago.models.MpAccountLink;

public interface MpAuthService {
    String buildAuthorizationUrl(String state, Long userIdApp);
    OauthStatusDTO getStatus(Long userIdApp);
    void handleCallback(String code, String state, Long userIdApp);
    void unlink(Long userIdApp);
    MpAccountLink getAccountLink(Long userIdApp);
}
