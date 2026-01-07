package com.example.mycfo2.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinancialData {
    private Integer año;
    private Integer mes;
    private Double ingresos;
    private Double egresos;
}

