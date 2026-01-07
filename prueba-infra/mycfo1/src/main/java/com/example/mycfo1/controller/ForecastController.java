package com.example.mycfo1.controller;

import com.example.mycfo1.dto.ForecastResponse;
import com.example.mycfo1.service.MyCFO2Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ForecastController {

    @Autowired
    private MyCFO2Service mycfo2Service;

    @GetMapping("/forecast")
    public ResponseEntity<ForecastResponse> getForecast() {
        ForecastResponse response = mycfo2Service.callMyCFO2();
        return ResponseEntity.ok(response);
    }
}

