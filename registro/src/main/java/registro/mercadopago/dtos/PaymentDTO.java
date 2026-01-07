package registro.mercadopago.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PaymentDTO {
    // Campos principales para la tabla
    private String categoria;
    private String descripcion;
    private LocalDate fecha;
    private String origen;
    private BigDecimal montoTotal;
    private String tipo; // INGRESO, EGRESO, etc.
    
    // Campos adicionales para funcionalidad
    private Long id; // ID del registro para edición
    private Long mpPaymentId;
    private String moneda;
    private String estado;
    
    // Campos para detección de duplicados
    private Boolean esDuplicado = false;
    private String motivoDuplicado;

    // getters/setters principales
    public String getCategoria(){return categoria;} public void setCategoria(String v){this.categoria=v;}
    public String getDescripcion(){return descripcion;} public void setDescripcion(String v){this.descripcion=v;}
    public LocalDate getFecha(){return fecha;} public void setFecha(LocalDate v){this.fecha=v;}
    public String getOrigen(){return origen;} public void setOrigen(String v){this.origen=v;}
    public BigDecimal getMontoTotal(){return montoTotal;} public void setMontoTotal(BigDecimal v){this.montoTotal=v;}
    public String getTipo(){return tipo;} public void setTipo(String v){this.tipo=v;}
    
    // getters/setters adicionales
    public Long getId(){return id;} public void setId(Long v){this.id=v;}
    public Long getMpPaymentId(){return mpPaymentId;} public void setMpPaymentId(Long v){this.mpPaymentId=v;}
    public String getMoneda(){return moneda;} public void setMoneda(String v){this.moneda=v;}
    public String getEstado(){return estado;} public void setEstado(String v){this.estado=v;}
    
    // getters/setters para duplicados
    public Boolean getEsDuplicado(){return esDuplicado;} public void setEsDuplicado(Boolean v){this.esDuplicado=v;}
    public String getMotivoDuplicado(){return motivoDuplicado;} public void setMotivoDuplicado(String v){this.motivoDuplicado=v;}
}
