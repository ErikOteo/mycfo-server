package registro.cargarDatos.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class DocumentoComercial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDocumento;

    private String tipoDocumento;

    @Column(nullable = false, unique = true)
    private String numeroDocumento; //obligatorio

    private LocalDateTime fechaEmision; //obligatorio

    private Double montoTotal; //obligatorio

    @Enumerated(EnumType.STRING)
    private TipoMoneda moneda; //obligatorio

    private String categoria; //obligatorio

    private EstadoDocumentoComercial estadoDocumentoComercial; //obligatorio


    @Enumerated(EnumType.STRING)
    private VersionDocumento versionDocumento; //obligatorio

    // historial
    private LocalDateTime fechaCreacion; //interno
    private LocalDateTime fechaActualizacion; //interno
    
    // Usuario que creó el documento (sub de Cognito)
    private String usuarioId; //interno
    
    // Organización a la que pertenece el documento
    private Long organizacionId; //interno

}