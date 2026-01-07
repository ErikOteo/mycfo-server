package registro.mercadopago.dtos;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class OauthStatusDTO {
    private boolean linked;
    private String accountEmail;
    private String nickname;
    private String siteId;
    private Boolean liveMode;
    private Instant linkedAt;
    private String mpUserId;
    private Instant expiresAt;
    public OauthStatusDTO() {}
    public OauthStatusDTO(boolean linked, String email, String user, Instant exp) {
        this.linked = linked; this.accountEmail = email; this.mpUserId = user; this.expiresAt = exp;
    }


}
