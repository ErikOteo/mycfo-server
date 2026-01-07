package reporte.dtos;

import java.util.List;

public class ResumenMensualDTO {
    private double ingresos;
    private double egresos;
    private double balance;
    private List<DetalleCategoriaDTO> detalleIngresos;
    private List<DetalleCategoriaDTO> detalleEgresos;

    public ResumenMensualDTO(double ingresos, double egresos, double balance,
                             List<DetalleCategoriaDTO> detalleIngresos,
                             List<DetalleCategoriaDTO> detalleEgresos) {
        this.ingresos = ingresos;
        this.egresos = egresos;
        this.balance = balance;
        this.detalleIngresos = detalleIngresos;
        this.detalleEgresos = detalleEgresos;
    }

    public double getIngresos() { return ingresos; }
    public double getEgresos() { return egresos; }
    public double getBalance() { return balance; }
    public List<DetalleCategoriaDTO> getDetalleIngresos() { return detalleIngresos; }
    public List<DetalleCategoriaDTO> getDetalleEgresos() { return detalleEgresos; }
}
