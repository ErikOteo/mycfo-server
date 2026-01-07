package registro.mercadopago.controllers;

import registro.mercadopago.services.MpWebhookService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mp/webhooks")
public class MpWebhookController {
    private final MpWebhookService service;
    public MpWebhookController(MpWebhookService service){ this.service = service; }

    @PostMapping
    public ResponseEntity<Void> receive(@RequestHeader(value="X-Signature", required=false) String sig,
                                        @RequestBody String body){
        service.handle(sig, body);
        return ResponseEntity.ok().build();
    }
}

