package reporte.controllers;

import org.springframework.web.bind.annotation.*;
import reporte.dtos.ProfitAndLossDTO;
import reporte.services.ProfitAndLossService;

@RestController
@RequestMapping("/pyl")
public class ProfitAndLossController {

    private final ProfitAndLossService profitAndLossService;

    public ProfitAndLossController(ProfitAndLossService profitAndLossService) {
        this.profitAndLossService = profitAndLossService;
    }

    /**
     * Devuelve el estado de resultados (Profit & Loss) del año solicitado.
     */
    @GetMapping
    public ProfitAndLossDTO obtenerProfitAndLoss(@RequestParam int anio,
                                                 @RequestParam(required = false) String moneda,
                                                 @RequestHeader(value = "X-Usuario-Sub") String userSub) {
        return profitAndLossService.obtenerFacturasPorAnio(anio, userSub, moneda);
    }
}
