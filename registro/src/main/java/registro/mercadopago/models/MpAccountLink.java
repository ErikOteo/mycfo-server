package registro.mercadopago.models;

import registro.mercadopago.config.CryptoConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity @Table(name="mp_account_link")
public class MpAccountLink {

    @Setter
    @Getter
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @Setter
    @Getter
    @Column(nullable=false, length=64) private String userIdApp;

    @Setter
    @Getter
    @Column(nullable=false, unique=true) private String mpUserId;

    @Setter
    @Getter
    @Column(nullable=false, unique=true) private String nickname;

    @Setter
    @Getter
    @Column(nullable=false) private String email;

    @Setter
    @Getter
    @Convert(converter = CryptoConverter.class) @Column(nullable=false, length=2048) private String accessToken;

    @Setter
    @Getter
    @Convert(converter = CryptoConverter.class) @Column(nullable=false, length=2048) private String refreshToken;

    @Setter
    @Getter
    private String scope;

    @Setter
    @Getter
    @Column(nullable=false) private Instant expiresAt;

    @Setter
    @Getter
    @Column(nullable=false) private Instant createdAt;

    @Setter
    @Getter
    @Column(nullable=false) private Instant updatedAt;

    @Setter
    @Getter
    @Column private String siteId;

    @Setter
    @Getter
    @Column private Boolean liveMode;

    @Lob
    private byte[] accessTokenEnc;

    @Lob
    private byte[] refreshTokenEnc;

}
