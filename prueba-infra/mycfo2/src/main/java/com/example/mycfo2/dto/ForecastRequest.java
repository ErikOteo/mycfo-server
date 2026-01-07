package com.example.mycfo2.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForecastRequest {
    private List<FinancialData> data;
    private Integer periodos_adelante;
}

