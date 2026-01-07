package registro.cargarDatos.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "registro") // Mantener nombre de tabla para compatibilidad con BD existente
@Getter
@Setter
public class Movimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tipo de movimiento: INGRESO / EGRESO / DEUDA / ACREENCIA
    @Enumerated(EnumType.STRING)
    private TipoMovimiento tipo;

    private Double montoTotal; //obligatorio

    private LocalDateTime fechaEmision; //obligatorio

    private String categoria;
    
    // Campos para origen y destino detallados
    private String origenNombre;
    private String origenCuit;
    private String destinoNombre;
    private String destinoCuit;
    
    private String descripcion;  // Detalle libre

    // historial
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    // Usuario que creó el movimiento (sub de Cognito)
    private String usuarioId;
    
    // Organización a la que pertenece el movimiento
    private Long organizacionId;

    @Enumerated(EnumType.STRING)
    private TipoMedioPago medioPago;        // efectivo, transferencia, etc.

    @Enumerated(EnumType.STRING)
    private TipoMoneda moneda;           //obligatorio

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_documento", insertable = false, updatable = false)
    @JsonIgnore
    @Setter(AccessLevel.NONE) // Prevenir que Lombok genere setter, usar el método manual
    private DocumentoComercial documentoComercial;

    // Campo para almacenar el ID del documento sin cargar la relación (para performance)
    @Column(name = "id_documento")
    private Long documentoId;

    /**
     * Indica si el movimiento está conciliado (tiene documento vinculado)
     */
    @JsonProperty("conciliado")
    public boolean isConciliado() {
        return documentoId != null;
    }

    /**
     * Vincula con un documento comercial
     */
    @JsonIgnore
    public void setDocumentoComercial(DocumentoComercial documento) {
        this.documentoComercial = documento;
        this.documentoId = documento != null ? documento.getIdDocumento() : null;
    }

    // ========================================
    // CAMPOS ESPECÍFICOS DE CADA TIPO
    // (vacíos para tipos que no los usen)
    // ========================================

    // Para Deudas y Acreencias
    private LocalDate fechaVencimiento;
    private Double montoPagado;
    private Integer cantidadCuotas;
    private Integer cuotasPagadas;
    private Double montoCuota;
    private Double tasaInteres;
    private String periodicidad; // Mensual, Trimestral, etc.

    // Estado del movimiento (UNIFICADO)
    @Enumerated(EnumType.STRING)
    private EstadoMovimiento estado;

}

