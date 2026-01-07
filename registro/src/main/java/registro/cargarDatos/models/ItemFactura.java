package registro.cargarDatos.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ItemFactura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idItemFactura;

    private Integer cantidad;
    private String descripcion;
    private Double precioUnitario;
    private Double subtotalSinIva;
    private Double alicuotaIva;
    private Double montoTotalItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "factura_id")
    @JsonBackReference("factura-items") // rompe el ciclo Factura -> ItemFactura -> Factura
    private Factura factura;
}
