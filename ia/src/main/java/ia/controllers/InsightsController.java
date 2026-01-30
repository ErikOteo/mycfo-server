package ia.controllers;

import ia.services.InsightsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ia")
@RequiredArgsConstructor
@Slf4j
public class InsightsController {

    private final InsightsService insightsService;

    @PostMapping("/insights")
    public ResponseEntity<Map<String, Object>> generarInsights(
            @RequestHeader("X-Usuario-Sub") String userSub,
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) Integer mes
    ) {
        log.info("Insights request: userSub={}, anio={}, mes={}", userSub, anio, mes);
        var resp = insightsService.generarInsights(userSub, authorization, anio, mes);
        log.info("Insights response ready: userSub={}, keys={}", userSub, resp != null ? resp.keySet() : "null");
        return ResponseEntity.ok(resp);
    }
}
