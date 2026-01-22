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
                                             @RequestHeader(value = "X-Usuario-Sub") String userSub,
                                             @RequestHeader(value = "Authorization") String authorization) {
        return cashflowService.obtenerRegistrosPorAnio(anio, userSub, authorization);
    }
}
