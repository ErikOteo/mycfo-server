package registro.cargarDatos.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Recibo extends DocumentoComercial {

    @Enumerated(EnumType.STRING)
    private TipoMedioPago medioPago; // EFECTIVO, TRANSFERENCIA, CHEQUE (obligatorio)

    // --- Datos del receptor ---
    private String receptorNombre; // obligatorio
    private String receptorCuit;
    private String receptorCondicionIVA;
    private String receptorDomicilio;

    // --- Datos del emisor ---
    private String emisorNombre; // obligatorio
    private String emisorCuit;
    private String emisorCondicionIVA;
    private String emisorDomicilio;

    // --- Documento asociado ---
    @ManyToOne
    @JoinColumn(name = "factura_id")
    @JsonBackReference("factura-recibos")
    private Factura factura; // opcional

    @ManyToOne
    @JoinColumn(name = "pagare_id")
    @JsonBackReference("pagare-recibos")
    private Pagare pagare; // opcional
}
