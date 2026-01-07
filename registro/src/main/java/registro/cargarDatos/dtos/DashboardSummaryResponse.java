package registro.cargarDatos.dtos;

import java.util.List;

import lombok.Builder;
import lombok.Value;
import registro.cargarDatos.models.Movimiento;
import registro.cargarDatos.models.Factura;

@Value
@Builder
public class DashboardSummaryResponse {

    ResumenMensualResponse resumenMensual;
    SaldoTotalResponse saldoTotal;
    MontosMensualesResponse ingresosMensuales;
    MontosMensualesResponse egresosMensuales;
    MontosPorCategoriaResponse ingresosPorCategoria;
    MontosPorCategoriaResponse egresosPorCategoria;
    ConciliacionResumenResponse conciliacion;
    List<Movimiento> movimientosRecientes;
    List<Factura> facturasRecientes;
}
