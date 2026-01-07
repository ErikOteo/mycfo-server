package registro.mercadopago.services.impl;

import registro.mercadopago.config.MpProperties;
import registro.mercadopago.dtos.OauthStatusDTO;
import registro.mercadopago.models.MpAccountLink;
import registro.mercadopago.repositories.MpAccountLinkRepository;
import registro.mercadopago.repositories.MpPaymentRepository;
import registro.mercadopago.repositories.MpWalletMovementRepository;
import registro.mercadopago.services.MpAuthService;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class MpAuthServiceImpl implements MpAuthService {
    private final MpProperties props;
    private final MpAccountLinkRepository repo;
    private final MpPaymentRepository paymentRepo;
    private final MpWalletMovementRepository movementRepo;
    private final RestTemplate rest = new RestTemplate();

    public MpAuthServiceImpl(
            MpProperties props,
            MpAccountLinkRepository repo,
            MpPaymentRepository paymentRepo,
            MpWalletMovementRepository movementRepo
    ) {
        this.props = props;
        this.repo = repo;
        this.paymentRepo = paymentRepo;
        this.movementRepo = movementRepo;
    }

    @Override
    public String buildAuthorizationUrl(String ignored, Long userIdApp) {
        // Siempre forzar nuevo login - limpiar cualquier sesión existente
        System.out.println(">>> Forzando nuevo login OAuth para usuario: " + userIdApp);
        
        // Limpiar cualquier link existente antes de generar nueva URL
        Optional<MpAccountLink> existingLink = repo.findByUserIdApp(userIdApp);
        if (existingLink.isPresent()) {
            System.out.println(">>> Limpiando sesión anterior antes de nuevo login");
            // No borramos el link completo, solo invalidamos los tokens
            MpAccountLink link = existingLink.get();
            revokeAuthorization(link);
            link.setAccessToken(null);
            link.setRefreshToken(null);
            link.setExpiresAt(Instant.now().minusSeconds(1)); // Token expirado
            link.setUpdatedAt(Instant.now());
            repo.save(link);
        }
        
        String signedState = buildSignedState(userIdApp);

        if (props.getClientId() == null || props.getClientId().isBlank()
                || props.getRedirectUri() == null || props.getRedirectUri().isBlank()
                || props.getOauthAuthorize() == null || props.getOauthAuthorize().isBlank()) {
            throw new IllegalStateException(
                    "Mercado Pago no está configurado: verificá clientId, clientSecret, redirectUri y oauthAuthorize."
            );
        }

        // Agregar parámetros para forzar nuevo login
        String q = "client_id=" + enc(props.getClientId())
                + "&response_type=code"
                + "&redirect_uri=" + enc(props.getRedirectUri())
                + "&state=" + enc(signedState)
                + "&prompt=login"  // Forzar login
                + "&approval_prompt=force" // Forzar aprobación
                + "&force_login=true"      // Parám específico de MP
                + "&skip_confirm=false";   // Evita saltar confirmaciones previas
        
        System.out.println(">>> URL de autorización generada con forzado de login");
        return props.getOauthAuthorize() + "?" + q;
    }

    @Override
    public OauthStatusDTO getStatus(Long userIdApp) {
        Optional<MpAccountLink> link = repo.findByUserIdApp(userIdApp);
        if (link.isEmpty()) {
            System.out.println(">>> No hay cuenta vinculada para usuario: " + userIdApp);
            return new OauthStatusDTO(false, null, null, null);
        }

        MpAccountLink l = link.get();

        // Verificar si los tokens están válidos
        if (isBlank(l.getAccessToken()) || l.getExpiresAt() == null || l.getExpiresAt().isBefore(Instant.now())) {
            System.out.println(">>> Tokens expirados o inválidos para usuario: " + userIdApp);
            return new OauthStatusDTO(false, null, null, null);
        }

        if (isBlank(l.getEmail()) || isBlank(l.getMpUserId())) {
            try { 
                enrichAccountIdentity(l); 
            } catch (Exception e) {
                System.out.println(">>> Error al enriquecer identidad de cuenta: " + e.getMessage());
                return new OauthStatusDTO(false, null, null, null);
            }
        }
        
        System.out.println(">>> Cuenta válida para usuario: " + userIdApp + " - Email: " + l.getEmail());
        return new OauthStatusDTO(true, l.getEmail(), l.getMpUserId(), l.getExpiresAt());
    }

    @Override
    public MpAccountLink getAccountLink(Long userIdApp) {
        return repo.findByUserIdApp(userIdApp).orElse(null);
    }

    @Override
    public void handleCallback(String code, String state, Long userIdApp) {
        if (!verifySignedState(state, userIdApp, 5 * 60_000L)) {
            throw new IllegalArgumentException("invalid state");
        }
        
        System.out.println(">>> Procesando callback OAuth para usuario: " + userIdApp);
        
        TokenResponse token = exchangeCodeForToken(code);

        // Buscar link existente o crear uno nuevo
        MpAccountLink link = repo.findByUserIdApp(userIdApp).orElse(new MpAccountLink());
        
        // Si ya existe un link, limpiar datos anteriores
        if (link.getId() != null) {
            System.out.println(">>> Limpiando datos de sesión anterior para usuario: " + userIdApp);
            // Limpiar tokens anteriores
            link.setAccessToken(null);
            link.setRefreshToken(null);
            link.setExpiresAt(null);
        }
        
        // Configurar nuevos datos
        link.setUserIdApp(userIdApp);
        link.setAccessToken(token.getAccessToken());
        link.setRefreshToken(token.getRefreshToken());
        link.setScope(props.getScope());
        link.setLiveMode(Boolean.TRUE.equals(token.getLiveMode()));

        long sec = token.getExpiresIn() != null ? token.getExpiresIn() : 3600L;
        link.setExpiresAt(Instant.now().plusSeconds(Math.max(0, sec - 60)));

        if (link.getCreatedAt() == null) link.setCreatedAt(Instant.now());
        link.setUpdatedAt(Instant.now());

        enrichAccountIdentity(link);
        repo.save(link);
        
        System.out.println(">>> Cuenta MP vinculada exitosamente para usuario: " + userIdApp);
    }

    /* =========================
       Desvincular con purge completo
       ========================= */
    @Override
    @Transactional
    public void unlink(Long userIdApp) {
        // Buscamos el link del usuario
        MpAccountLink link = repo.findByUserIdApp(userIdApp)
                .orElse(null);
        if (link == null) {
            // idempotente: nada para hacer
            return;
        }
        Long linkId = link.getId();

        System.out.println(">>> Desvinculando cuenta MP para usuario: " + userIdApp);

        // Revocar autorización en Mercado Pago antes de limpiar localmente
        revokeAuthorization(link);

        // 1) Borro pagos NO facturados del link
        int deletedPayments = paymentRepo.deleteNotInvoicedByLink(linkId);
        System.out.println(">>> Pagos no facturados eliminados: " + deletedPayments);

        // 2) Borro movimientos de billetera del link (siempre)
        int deletedMovements = movementRepo.deleteByAccountLinkId(linkId);
        System.out.println(">>> Movimientos de billetera eliminados: " + deletedMovements);

        // 3) Desasocio pagos facturados (SET account_link_id = NULL)
        int detachedPayments = paymentRepo.detachInvoicedByLink(linkId);
        System.out.println(">>> Pagos facturados desasociados: " + detachedPayments);

        // 4) Limpiar tokens en memoria (si los hay)
        link.setAccessToken(null);
        link.setRefreshToken(null);
        link.setExpiresAt(null);
        link.setUpdatedAt(Instant.now());

        // 5) Elimino el link (ya sin dependencias duras)
        repo.delete(link);
        
        System.out.println(">>> Cuenta MP desvinculada completamente para usuario: " + userIdApp);
    }

    private void revokeAuthorization(MpAccountLink link) {
        if (link == null || isBlank(link.getAccessToken()) || isBlank(link.getMpUserId())) {
            return;
        }

        String clientId = props.getClientId();
        if (isBlank(clientId)) {
            System.err.println(">>> No se puede revocar autorización MP: clientId no configurado");
            return;
        }

        String url = ensureSuffix(props.getApiBase(), "") +
                "/users/" + link.getMpUserId() + "/applications/" + clientId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(link.getAccessToken());

        try {
            rest.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Void.class);
            System.out.println(">>> Autorización MP revocada para user " + link.getMpUserId());
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            System.err.println(">>> Error revocando autorización MP (" + e.getStatusCode() + "): " + e.getResponseBodyAsString());
        } catch (Exception e) {
            System.err.println(">>> Error revocando autorización MP: " + e.getMessage());
        }
    }

    /* =========================
       Métodos privados — helpers
       ========================= */

    private TokenResponse exchangeCodeForToken(String code) {
        if (isBlank(code)) throw new IllegalArgumentException("code vacío");

        String url = ensureSuffix(props.getApiBase(), "") + "/oauth/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = "grant_type=authorization_code"
                + "&client_id=" + enc(props.getClientId())
                + "&client_secret=" + enc(props.getClientSecret())
                + "&code=" + enc(code)
                + "&redirect_uri=" + enc(props.getRedirectUri());

        HttpEntity<String> req = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<TokenResponse> res =
                    rest.exchange(url, HttpMethod.POST, req, TokenResponse.class);

            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                throw new IllegalStateException("MP /oauth/token respondió " + res.getStatusCode());
            }
            return res.getBody();

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String resp = e.getResponseBodyAsString();
            System.err.println("ERROR intercambiando code->token en MP: " + e.getStatusCode());
            System.err.println("Body: " + resp);
            throw new IllegalStateException("Fallo intercambio code->token: " + e.getStatusCode() + " - " + resp, e);
        }
    }

    private void enrichAccountIdentity(MpAccountLink link) {
        if (isBlank(link.getAccessToken())) return;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(link.getAccessToken());
        HttpEntity<Void> req = new HttpEntity<>(headers);

        String url = ensureSuffix(props.getApiBase(), "") + "/users/me";
        ResponseEntity<Map> res = rest.exchange(url, HttpMethod.GET, req, Map.class);
        if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) return;

        Map<?, ?> body = res.getBody();

        Object id        = body.get("id");
        Object nickname  = body.get("nickname");
        Object email     = body.get("email");
        Object siteId    = body.get("site_id");
        Object liveMode  = body.get("live_mode");

        if (id != null)       link.setMpUserId(String.valueOf(id));
        if (nickname != null) link.setNickname(String.valueOf(nickname));
        if (email != null)    link.setEmail(String.valueOf(email));
        if (siteId != null)   link.setSiteId(String.valueOf(siteId));
        if (liveMode != null) link.setLiveMode(Boolean.valueOf(String.valueOf(liveMode)));

        link.setUpdatedAt(Instant.now());
    }

    private String enc(String s) {
        if (s == null || s.isBlank()) {
            throw new IllegalStateException("Valor requerido para OAuth es nulo o vacío");
        }
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private boolean isBlank(String s) { return s == null || s.isBlank(); }

    private String ensureSuffix(String base, String suffix) {
        if (base == null) return suffix;
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    // ==== STATE firmado HMAC-SHA256 ====

    private String sign(String data, String secret) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        } catch (Exception e) { throw new IllegalStateException(e); }
    }

    private String b64(String s){
        return java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString(s.getBytes(StandardCharsets.UTF_8));
    }

    private String buildSignedState(Long userId) {
        long ts = System.currentTimeMillis();
        String payload = userId + ":" + ts;
        String sig = sign(payload, props.getClientSecret());
        return b64(payload + ":" + sig);
    }

    // (quedó para compatibilidad; ahora hace purge antes de borrar)
    public void unlinkLegacyDelete(Long userIdApp) {
        repo.findByUserIdApp(userIdApp).ifPresent(repo::delete);
    }

    private boolean verifySignedState(String stateB64, Long expectedUserId, long maxAgeMs) {
        try {
            String decoded = new String(java.util.Base64.getUrlDecoder().decode(stateB64), StandardCharsets.UTF_8);
            String[] parts = decoded.split(":");
            if (parts.length != 3) return false;
            Long userId = Long.parseLong(parts[0]);
            long ts = Long.parseLong(parts[1]);
            String sig = parts[2];

            if (System.currentTimeMillis() - ts > maxAgeMs) return false;
            if (!userId.equals(expectedUserId)) return false;

            String expectedSig = sign(parts[0] + ":" + parts[1], props.getClientSecret());
            return Objects.equals(sig, expectedSig);
        } catch (Exception e) {
            return false;
        }
    }

    /* =========================
       DTO local para token
       ========================= */
    public static class TokenResponse {
        private String access_token;
        private String refresh_token;
        private Long   expires_in;
        private Boolean live_mode;

        public String getAccessToken() { return access_token; }
        public String getRefreshToken() { return refresh_token; }
        public Long getExpiresIn() { return expires_in; }
        public Boolean getLiveMode() { return live_mode; }

        public void setAccess_token(String s) { this.access_token = s; }
        public void setRefresh_token(String s) { this.refresh_token = s; }
        public void setExpires_in(Long s) { this.expires_in = s; }
        public void setLive_mode(Boolean b) { this.live_mode = b; }
    }
}

