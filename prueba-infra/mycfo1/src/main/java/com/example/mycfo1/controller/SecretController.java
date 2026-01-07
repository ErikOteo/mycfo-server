package com.example.mycfo1.controller;

import com.example.mycfo1.dto.SecretResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class SecretController {

    @Value("${app.test.secret:No configurado}")
    private String testSecret;

    @GetMapping("/secret/test")
    public ResponseEntity<SecretResponse> getSecret() {
        SecretResponse response = new SecretResponse(testSecret, "app.test.secret");
        return ResponseEntity.ok(response);
    }
}

