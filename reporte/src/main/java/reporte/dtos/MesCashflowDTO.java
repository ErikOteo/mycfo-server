package reporte.dtos;

public class MesCashflowDTO {
    private int mes; // 1..12
    private double ingresos;
    private double egresos;
    private double netCashFlow;
    private double cashOnHandInicio;
    private double cashOnHandFin;

    public MesCashflowDTO(int mes, double ingresos, double egresos,
                          double netCashFlow, double cashOnHandInicio, double cashOnHandFin) {
        this.mes = mes;
        this.ingresos = ingresos;
        this.egresos = egresos;
        this.netCashFlow = netCashFlow;
        this.cashOnHandInicio = cashOnHandInicio;
        this.cashOnHandFin = cashOnHandFin;
    }

    public int getMes() { return mes; }
    public double getIngresos() { return ingresos; }
    public double getEgresos() { return egresos; }
    public double getNetCashFlow() { return netCashFlow; }
    public double getCashOnHandInicio() { return cashOnHandInicio; }
    public double getCashOnHandFin() { return cashOnHandFin; }
}
