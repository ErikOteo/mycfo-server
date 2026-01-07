package com.example.mycfo2.controller;

import com.example.mycfo2.dto.ForecastRequest;
import com.example.mycfo2.dto.ForecastResponse;
import com.example.mycfo2.service.DataGeneratorService;
import com.example.mycfo2.service.LambdaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ForecastController {

    @Autowired
    private DataGeneratorService dataGeneratorService;

    @Autowired
    private LambdaService lambdaService;

    @GetMapping("/forecast/process")
    public ResponseEntity<ForecastResponse> processForecast() {
        // Generar datos financieros
        ForecastRequest forecastRequest = dataGeneratorService.generateFinancialData();

        // Llamar a Lambda para procesar
        ForecastResponse response = lambdaService.callLambdaForecast(forecastRequest);

        return ResponseEntity.ok(response);
    }
}

