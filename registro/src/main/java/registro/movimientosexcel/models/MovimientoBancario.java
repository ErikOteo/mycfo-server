package registro.movimientosexcel.models;

import jakarta.persistence.*;
import lombok.Setter;

import java.time.LocalDate;

@Entity
public class MovimientoBancario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    private String idReferencia;
    // Setters
    @Setter
    private LocalDate fecha;
    @Setter
    private String descripcion;
    @Setter
    private Double monto;
    @Setter
    private String medioPago;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Setter private OrigenMovimiento origen;

    @Setter @Column(columnDefinition = "json") //JSON PUEDE SERVIR EN ALGUN MOMENTO?
    private String extra;

    public enum OrigenMovimiento { MYCFO, MERCADO_PAGO, SANTANDER }


    // Getters
    public Long getId() {
        return id;
    }

    public String getIdReferencia() {
        return idReferencia;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public Double getMonto() {
        return monto;
    }

    public String getMedioPago() {
        return medioPago;
    }
}

