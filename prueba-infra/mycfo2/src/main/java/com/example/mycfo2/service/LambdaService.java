package com.example.mycfo2.service;

import com.example.mycfo2.dto.ForecastRequest;
import com.example.mycfo2.dto.ForecastResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class LambdaService {

    private final WebClient webClient;

    @Value("${lambda.forecast.url}")
    private String lambdaUrl;

    public LambdaService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public ForecastResponse callLambdaForecast(ForecastRequest request) {
        try {
            Object response = webClient.post()
                    .uri(lambdaUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block();

            return new ForecastResponse(response, "Forecast procesado exitosamente");
        } catch (Exception e) {
            return new ForecastResponse(null, "Error al llamar a Lambda: " + e.getMessage());
        }
    }
}

