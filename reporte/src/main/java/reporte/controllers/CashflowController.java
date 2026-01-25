package reporte.controllers;

import org.springframework.web.bind.annotation.*;
import reporte.dtos.RegistroDTO;

import java.util.List;

import reporte.services.CashflowService;

@RestController
@RequestMapping("/cashflow")
public class CashflowController {

    private final CashflowService cashflowService;

    public CashflowController(CashflowService cashflowService) {
        this.cashflowService = cashflowService;
    }

    @GetMapping
    public List<RegistroDTO> obtenerCashflow(@RequestParam int anio,
                                             @RequestParam(required = false) String moneda,
                                             @RequestHeader(value = "X-Usuario-Sub") String userSub,
                                             @RequestHeader(value = "Authorization", required = false) String authorization) {
        return cashflowService.obtenerRegistrosPorAnio(anio, userSub, moneda, authorization);
    }
}
