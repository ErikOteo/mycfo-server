// consolidacion/mercadopago/dtos/WalletMovementDTO.java
package registro.mercadopago.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

public class WalletMovementDTO {
    private String movementId;
    private LocalDate fecha;
    private BigDecimal monto;
    private String moneda;
    private String tipo;
    private String descripcion;
    private String estado;

    public String getMovementId() { return movementId; } public void setMovementId(String v) { this.movementId = v; }
    public LocalDate getFecha() { return fecha; } public void setFecha(LocalDate v) { this.fecha = v; }
    public BigDecimal getMonto() { return monto; } public void setMonto(BigDecimal v) { this.monto = v; }
    public String getMoneda() { return moneda; } public void setMoneda(String v) { this.moneda = v; }
    public String getTipo() { return tipo; } public void setTipo(String v) { this.tipo = v; }
    public String getDescripcion() { return descripcion; } public void setDescripcion(String v) { this.descripcion = v; }
    public String getEstado() { return estado; } public void setEstado(String v) { this.estado = v; }
}
