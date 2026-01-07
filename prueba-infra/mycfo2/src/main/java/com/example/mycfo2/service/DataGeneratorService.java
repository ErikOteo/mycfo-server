package com.example.mycfo2.service;

import com.example.mycfo2.dto.FinancialData;
import com.example.mycfo2.dto.ForecastRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DataGeneratorService {

    public ForecastRequest generateFinancialData() {
        List<FinancialData> data = new ArrayList<>();

        // Datos exactos para 2021 según especificación
        data.add(new FinancialData(2021, 1, 11000.0, -6000.0));
        data.add(new FinancialData(2021, 2, 11500.0, -6200.0));
        data.add(new FinancialData(2021, 3, 12000.0, -6500.0));
        data.add(new FinancialData(2021, 4, 11800.0, -6400.0));
        data.add(new FinancialData(2021, 5, 12500.0, -6600.0));
        data.add(new FinancialData(2021, 6, 13000.0, -7000.0));
        data.add(new FinancialData(2021, 7, 12800.0, -6800.0));
        data.add(new FinancialData(2021, 8, 13500.0, -7200.0));
        data.add(new FinancialData(2021, 9, 14000.0, -7500.0));
        data.add(new FinancialData(2021, 10, 13800.0, -7400.0));
        data.add(new FinancialData(2021, 11, 14500.0, -7600.0));
        data.add(new FinancialData(2021, 12, 15000.0, -8000.0));

        // Datos exactos para 2022 según especificación
        data.add(new FinancialData(2022, 1, 15500.0, -8100.0));
        data.add(new FinancialData(2022, 2, 16000.0, -8300.0));
        data.add(new FinancialData(2022, 3, 16500.0, -8500.0));
        data.add(new FinancialData(2022, 4, 16300.0, -8400.0));
        data.add(new FinancialData(2022, 5, 17000.0, -8800.0));
        data.add(new FinancialData(2022, 6, 17500.0, -9000.0));
        data.add(new FinancialData(2022, 7, 17200.0, -8900.0));
        data.add(new FinancialData(2022, 8, 17800.0, -9100.0));
        data.add(new FinancialData(2022, 9, 18500.0, -9400.0));
        data.add(new FinancialData(2022, 10, 18200.0, -9300.0));
        data.add(new FinancialData(2022, 11, 19000.0, -9600.0));
        data.add(new FinancialData(2022, 12, 19500.0, -10000.0));

        // Datos exactos para 2023 según especificación
        data.add(new FinancialData(2023, 1, 20000.0, -10500.0));
        data.add(new FinancialData(2023, 2, 20500.0, -10800.0));
        data.add(new FinancialData(2023, 3, 21000.0, -11000.0));
        data.add(new FinancialData(2023, 4, 20800.0, -10900.0));
        data.add(new FinancialData(2023, 5, 21500.0, -11200.0));
        data.add(new FinancialData(2023, 6, 22000.0, -11500.0));
        data.add(new FinancialData(2023, 7, 21800.0, -11400.0));
        data.add(new FinancialData(2023, 8, 22500.0, -11800.0));
        data.add(new FinancialData(2023, 9, 23000.0, -12000.0));
        data.add(new FinancialData(2023, 10, 22800.0, -11850.0));
        data.add(new FinancialData(2023, 11, 23500.0, -12200.0));
        data.add(new FinancialData(2023, 12, 24000.0, -12500.0));

        return new ForecastRequest(data, 12);
    }
}

