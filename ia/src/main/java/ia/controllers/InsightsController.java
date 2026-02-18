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
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false, defaultValue = "ARS") String moneda
    ) {
        log.info("Insights request: userSub={}, anio={}, mes={}, moneda={}", userSub, anio, mes, moneda);
        try {
            var resp = insightsService.generarInsights(userSub, authorization, anio, mes, moneda);
            log.info("Insights response ready: userSub={}, keys={}", userSub, resp != null ? resp.keySet() : "null");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("No se pudo generar el reporte IA para userSub={}: {}", userSub, e.getMessage(), e);
            return ResponseEntity.status(502).body(Map.of(
                    "error", "No se pudo generar el reporte en este momento. Por favor contacta a soporte.",
                    "detalle", e.getMessage()
            ));
        }
    }
}
