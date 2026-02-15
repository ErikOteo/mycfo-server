package registro.cargarDatos.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Factura extends DocumentoComercial {

    private String tipoFactura; // obligatorio
    private String descripcion;

    // --- Datos del vendedor ---
    private String vendedorNombre; // obligatorio
    private String vendedorCuit;
    private String vendedorCondicionIVA;
    private String vendedorDomicilio;

    // --- Datos del comprador ---
    private String compradorNombre; // obligatorio
    private String compradorCuit;
    private String compradorCondicionIVA;
    private String compradorDomicilio;

    // --- Estado de pago ---
    @Enumerated(EnumType.STRING)
    private EstadoPago estadoPago;

    // --- Relación con ítems ---
    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("factura-items")
    private List<ItemFactura> items;

    // --- Relación con recibos ---
    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("factura-recibos")
    private List<Recibo> recibos;

    // --- Relación con pagarés ---
    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("factura-pagares")
    private List<Pagare> pagares;
}
