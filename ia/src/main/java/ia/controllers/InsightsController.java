package ia.controllers;

import ia.services.InsightsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ia")
@RequiredArgsConstructor
public class InsightsController {

    private final InsightsService insightsService;

    @PostMapping("/insights")
    public ResponseEntity<Map<String, Object>> generarInsights(
            @RequestHeader("X-Usuario-Sub") String userSub,
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) Integer mes
    ) {
        var resp = insightsService.generarInsights(userSub, authorization, anio, mes);
        return ResponseEntity.ok(resp);
    }
}
