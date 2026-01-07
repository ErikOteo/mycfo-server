package com.example.mycfo1.service;

import com.example.mycfo1.dto.ForecastResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class MyCFO2Service {

    private final WebClient webClient;

    @Value("${mycfo2.url}")
    private String mycfo2Url;

    public MyCFO2Service(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public ForecastResponse callMyCFO2() {
        try {
            ForecastResponse response = webClient.get()
                    .uri(mycfo2Url + "/api/v1/forecast/process")
                    .retrieve()
                    .bodyToMono(ForecastResponse.class)
                    .block();

            return response != null ? response : new ForecastResponse(null, "No se recibió respuesta de MyCFO2");
        } catch (Exception e) {
            return new ForecastResponse(null, "Error al llamar a MyCFO2: " + e.getMessage());
        }
    }
}

