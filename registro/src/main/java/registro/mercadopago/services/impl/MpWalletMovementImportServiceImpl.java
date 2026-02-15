// consolidacion/mercadopago/services/impl/MpWalletMovementImportServiceImpl.java
package registro.mercadopago.services.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import registro.mercadopago.config.MpProperties;
import registro.mercadopago.models.MpAccountLink;
import registro.mercadopago.models.MpWalletMovement;
import registro.mercadopago.repositories.MpAccountLinkRepository;
import registro.mercadopago.repositories.MpWalletMovementRepository;
import registro.mercadopago.services.util.MpWalletMovementImportService;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class MpWalletMovementImportServiceImpl implements MpWalletMovementImportService {

    private final MpWalletMovementRepository repo;
    private final MpAccountLinkRepository linkRepo;
    private final MpProperties props;
    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper om = new ObjectMapper();

    public MpWalletMovementImportServiceImpl(
            MpWalletMovementRepository repo,
            MpAccountLinkRepository linkRepo,
            MpProperties props
    ) {
        this.repo = repo; this.linkRepo = linkRepo; this.props = props;
    }

    @Override
    public int importRange(String userIdApp, LocalDate from, LocalDate to) {
        MpAccountLink link = requireLink(userIdApp);

        ZoneId zone = ZoneId.systemDefault();
        Instant fromI = from.atStartOfDay(zone).toInstant();
        Instant toI   = to.plusDays(1).atStartOfDay(zone).toInstant(); // exclusivo

        int imported = 0;
        int offset = 0;
        final int limit = 50;
        final int maxPages = 60; // 3000 items tope

        for (int page=0; page<maxPages; page++, offset+=limit) {
            List<Map<String,Object>> data = fetchWalletPage(link.getAccessToken(), fromI, toI, offset, limit);
            if (data.isEmpty()) break;

            boolean reachedOlder = false;
            for (Map<String,Object> m : data) {
                Instant when = extractMovementInstant(m);
                if (when == null) {
                    // Algunos movimientos no traen fecha en claves estándar; no cortamos paginado por eso.
                    upsertMovement(m, link);
                    imported++;
                    continue;
                }
                if (when.isBefore(fromI)) { reachedOlder = true; continue; }
                if (when.isBefore(toI)) {
                    upsertMovement(m, link);
                    imported++;
                }
            }
            if (reachedOlder) break;
        }
        return imported;
    }

    @Override
    public int importByMovementId(String userIdApp, String movementId) {
        MpAccountLink link = requireLink(userIdApp);

        // Probamos endpoints por ID
        List<String> candidates = List.of(
                "/v1/account/movements/" + enc(movementId),
                "/v1/account/activities/" + enc(movementId),
                "/v1/statement/" + enc(movementId) // por si tu cuenta lo nombra así
        );
        for (String path : candidates) {
            try {
                Map<String,Object> m = get(path, link.getAccessToken());
                if (m != null && !m.isEmpty()) {
                    upsertMovement(m, link);
                    return 1;
                }
            } catch (HttpStatusCodeException e) {
                if (e.getStatusCode().value() == 404) continue;
            }
        }
        return 0;
    }

    /* ============================ helpers ============================ */

    private MpAccountLink requireLink(String userIdApp) {
        return linkRepo.findByUserIdApp(userIdApp)
                .orElseThrow(() -> new IllegalStateException("No hay cuenta vinculada de Mercado Pago"));
    }

    private HttpHeaders authHeaders(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        h.setAccept(List.of(MediaType.APPLICATION_JSON));
        return h;
    }

    @SuppressWarnings("unchecked")
    private Map<String,Object> get(String path, String token) {
        String url = props.getApiBase() + path;
        try {
            ResponseEntity<Map> res = rest.exchange(url, HttpMethod.GET, new HttpEntity<>(authHeaders(token)), Map.class);
            return (Map<String, Object>) res.getBody();
        } catch (HttpStatusCodeException e) {
            System.err.println("GET " + url + " -> " + e.getStatusCode());
            System.err.println("Body: " + e.getResponseBodyAsString());
            throw e;
        }
    }

    /** Trae una página de movimientos. Prueba endpoints y formatos; si no acepta fechas, trae ordenado y filtramos local. */
    @SuppressWarnings("unchecked")
    private List<Map<String,Object>> fetchWalletPage(String token, Instant from, Instant toExclusive, int offset, int limit) {
        // 1) Endpoints candidatos (cambia por país/cuenta)
        List<String> bases = List.of(
                "/v1/account/movements/search",
                "/v1/account/activities/search",
                "/v1/statement/search"
        );

        // 2) Formatos de fecha comunes (UTC con y sin milis; offset local)
        DateTimeFormatter FMT_MS_Z  = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC);
        DateTimeFormatter FMT_S_Z   = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'").withZone(ZoneOffset.UTC);
        DateTimeFormatter FMT_MS_O  = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSXXX").withZone(ZoneId.systemDefault());
        DateTimeFormatter FMT_S_O   = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX").withZone(ZoneId.systemDefault());

        String b1 = FMT_MS_Z.format(from);
        String e1 = FMT_MS_Z.format(toExclusive.minusMillis(1));
        String b2 = FMT_S_Z.format(from);
        String e2 = FMT_S_Z.format(toExclusive.minusMillis(1));
        String b3 = FMT_MS_O.format(from);
        String e3 = FMT_MS_O.format(toExclusive.minusMillis(1));
        String b4 = FMT_S_O.format(from);
        String e4 = FMT_S_O.format(toExclusive.minusMillis(1));

        List<String> urlsTried = new ArrayList<>();

        for (String base : bases) {
            // A) con rango (begin_date/end_date)
            List<String> urls = List.of(
                    props.getApiBase() + base + "?sort=date&criteria=desc&begin_date="+enc(b1)+"&end_date="+enc(e1)+"&offset="+offset+"&limit="+limit,
                    props.getApiBase() + base + "?sort=date&criteria=desc&begin_date="+enc(b2)+"&end_date="+enc(e2)+"&offset="+offset+"&limit="+limit,
                    props.getApiBase() + base + "?sort=date&criteria=desc&begin_date="+enc(b3)+"&end_date="+enc(e3)+"&offset="+offset+"&limit="+limit,
                    props.getApiBase() + base + "?sort=date&criteria=desc&begin_date="+enc(b4)+"&end_date="+enc(e4)+"&offset="+offset+"&limit="+limit
            );
            for (String url : urls) {
                try {
                    ResponseEntity<Map> res = rest.exchange(url, HttpMethod.GET, new HttpEntity<>(authHeaders(token)), Map.class);
                    Object list = pickList(res.getBody());
                    if (list instanceof List<?> l) return (List<Map<String,Object>>) l;
                } catch (HttpStatusCodeException e) {
                    if (e.getStatusCode().value() != 400) { // si es otro error, mostramos y seguimos con siguiente base
                        System.err.println("wallet search " + url + " -> " + e.getStatusCode());
                        System.err.println("Body: " + e.getResponseBodyAsString());
                    } else {
                        urlsTried.add(url + " -> 400");
                    }
                }
            }

            // B) sin fechas: traemos por páginas y filtramos localmente
            String urlNoDates = props.getApiBase() + base + "?sort=date&criteria=desc&offset="+offset+"&limit="+limit;
            try {
                ResponseEntity<Map> res = rest.exchange(urlNoDates, HttpMethod.GET, new HttpEntity<>(authHeaders(token)), Map.class);
                Object list = pickList(res.getBody());
                if (list instanceof List<?> l) return (List<Map<String,Object>>) l;
            } catch (HttpStatusCodeException e) {
                urlsTried.add(urlNoDates + " -> " + e.getStatusCode());
            }
        }

        // Como último recurso: pasar access_token por query
        String fallback = props.getApiBase() + "/v1/account/movements/search"
                + "?sort=date&criteria=desc&offset="+offset+"&limit="+limit
                + "&access_token=" + enc(token);
        try {
            ResponseEntity<Map> res = rest.exchange(fallback, HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), Map.class);
            Object list = pickList(res.getBody());
            if (list instanceof List<?> l) return (List<Map<String,Object>>) l;
        } catch (HttpStatusCodeException e) {
            System.err.println("wallet search fallback -> " + e.getStatusCode());
            System.err.println("URL: " + fallback);
            System.err.println("Body: " + e.getResponseBodyAsString());
            System.err.println("Tried URLs: " + String.join(" | ", urlsTried));
        }
        return List.of();
    }

    /** Los endpoints devuelven la lista bajo distintas claves */
    private Object pickList(Map body) {
        if (body == null) return null;
        if (body.get("results") != null) return body.get("results");
        if (body.get("elements") != null) return body.get("elements");
        if (body.get("items") != null) return body.get("items");
        if (body.get("data") != null) return body.get("data");
        return null;
    }

    private void upsertMovement(Map<String,Object> m, MpAccountLink link) {
        String id = asString(coalesce(
                m.get("id"),
                m.get("movement_id"),
                m.get("transaction_id"),
                m.get("operation_id"),
                m.get("operationId"),
                m.get("uuid"),
                m.get("number")
        ));
        if (id == null || id.isBlank()) return;

        MpWalletMovement wm = repo.findByMpMovementId(id).orElseGet(MpWalletMovement::new);
        boolean isNew = wm.getId() == null;

        wm.setAccountLink(link);
        wm.setMpMovementId(id);

        Instant when = extractMovementInstant(m);
        wm.setDateEvent(when);

        wm.setAmount(asBigDecimal(coalesce(m.get("amount"), m.get("transaction_amount"), m.get("net_amount"))));
        wm.setCurrency(asString(coalesce(m.get("currency"), m.get("currency_id"))));
        wm.setKind(asString(coalesce(m.get("type"), m.get("movement_type"), m.get("reason"))));
        wm.setStatus(asString(coalesce(m.get("status"), m.get("state"))));
        wm.setDescription(asString(coalesce(m.get("description"), m.get("detail"), m.get("comment"))));

        try { wm.setRawJson(om.writeValueAsString(m)); } catch (Exception ignored) {}

        Instant now = Instant.now();
        if (isNew) wm.setImportedAt(now);
        wm.setUpdatedAt(now);
        repo.save(wm);
    }

    /* ===== utils ===== */
    private Object coalesce(Object... xs) { for (Object x : xs) if (x != null) return x; return null; }
    private Instant extractMovementInstant(Map<String,Object> m) {
        return parseInstant(coalesce(
                m.get("date"),
                m.get("date_event"),
                m.get("posted_date"),
                m.get("created"),
                m.get("date_created"),
                m.get("created_at"),
                m.get("creation_date"),
                m.get("operation_date"),
                m.get("last_updated"),
                m.get("date_last_updated"),
                m.get("datetime"),
                m.get("timestamp")
        ));
    }
    private String enc(String s){ return URLEncoder.encode(s, StandardCharsets.UTF_8); }
    private String asString(Object o){ return o==null?null:String.valueOf(o); }
    private BigDecimal asBigDecimal(Object o){
        if (o==null) return null;
        try { return (o instanceof BigDecimal b)? b : new BigDecimal(String.valueOf(o)); }
        catch(Exception e){ return null; }
    }
    private Instant parseInstant(Object o){
        if (o==null) return null;
        if (o instanceof Number n) {
            long v = n.longValue();
            try {
                if (Math.abs(v) > 10_000_000_000L) return Instant.ofEpochMilli(v);
                return Instant.ofEpochSecond(v);
            } catch(Exception ignored){}
        }
        String s = String.valueOf(o);
        try { return OffsetDateTime.parse(s).toInstant(); } catch(Exception ignored){}
        try { return Instant.parse(s); } catch(Exception ignored){}
        try {
            DateTimeFormatter f = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneOffset.UTC);
            return LocalDateTime.parse(s, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")).toInstant(ZoneOffset.UTC);
        } catch(Exception ignored){}
        return null;
    }
}

