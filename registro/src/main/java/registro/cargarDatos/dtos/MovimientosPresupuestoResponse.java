package registro.cargarDatos.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovimientosPresupuestoResponse {
    
    private Long organizacionId;
    private String fechaDesde;
    private String fechaHasta;
    private List<MovimientosMensuales> datosMensuales;
    private ResumenTotal resumenTotal;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovimientosMensuales {
        private String mes; // "YYYY-MM"
        private BigDecimal totalIngresos;
        private BigDecimal totalEgresos;
        private BigDecimal saldoMensual; // ingresos - egresos
        private Integer cantidadIngresos;
        private Integer cantidadEgresos;
        private List<MovimientoPorCategoria> ingresosPorCategoria;
        private List<MovimientoPorCategoria> egresosPorCategoria;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovimientoPorCategoria {
        private String categoria;
        private BigDecimal monto;
        private Integer cantidad;
        private BigDecimal porcentaje; // del total del tipo (ingreso/egreso)
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumenTotal {
        private BigDecimal totalIngresos;
        private BigDecimal totalEgresos;
        private BigDecimal saldoTotal;
        private Integer totalMovimientos;
        private Integer mesesConDatos;
    }
}
