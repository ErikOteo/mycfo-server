package com.example.mycfo1.controller;

import com.example.mycfo1.dto.EnvironmentResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class EnvironmentController {

    @Value("${APP_TEST_ENV_VAR:No configurado}")
    private String testEnvVar;

    @GetMapping("/environment/test")
    public ResponseEntity<EnvironmentResponse> getEnvironment() {
        EnvironmentResponse response = new EnvironmentResponse(testEnvVar, "APP_TEST_ENV_VAR");
        return ResponseEntity.ok(response);
    }
}

