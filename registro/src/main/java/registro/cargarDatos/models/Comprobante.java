package registro.cargarDatos.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Comprobante extends DocumentoComercial {

    private String tipoComprobante; // obligatorio

    private String emisor;
    private String receptor;

    @Enumerated(EnumType.STRING)
    private EstadoPago estadoPago;

}
