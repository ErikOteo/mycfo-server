package registro.mercadopago.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import registro.cargarDatos.models.TipoMedioPago;
import registro.cargarDatos.models.TipoMoneda;
import registro.cargarDatos.models.TipoMovimiento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "mp_imported_payments")
@Getter
@Setter
public class MpImportedPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Referencia al registro original en la tabla Registro
    @Column(name = "registro_id")
    private Long registroId;

    // Datos del pago de Mercado Pago
    @Column(name = "mp_payment_id")
    private String mpPaymentId;

    @Column(name = "external_reference")
    private String externalReference;

    @Column(name = "description")
    private String description;

    @Column(name = "amount", precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency_id")
    private String currencyId;

    @Column(name = "payment_method_id")
    private String paymentMethodId;

    @Column(name = "payment_type_id")
    private String paymentTypeId;

    @Column(name = "status")
    private String status;

    @Column(name = "status_detail")
    private String statusDetail;

    @Column(name = "date_created")
    private LocalDateTime dateCreated;

    @Column(name = "date_approved")
    private LocalDateTime dateApproved;

    @Column(name = "date_last_updated")
    private LocalDateTime dateLastUpdated;

    // Campos mapeados a la estructura de Registro
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo")
    private TipoMovimiento tipo;

    @Column(name = "monto_total", precision = 19, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "fecha_emision")
    private LocalDate fechaEmision;

    @Column(name = "descripcion")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "medio_pago")
    private TipoMedioPago medioPago;

    @Enumerated(EnumType.STRING)
    @Column(name = "moneda")
    private TipoMoneda moneda;

    @Column(name = "categoria")
    private String categoria;

    @Column(name = "origen")
    private String origen = "MercadoPago";

    // Metadatos de importación
    @Column(name = "usuario_id")
    private UUID usuarioId;

    @Column(name = "fecha_importacion")
    private LocalDateTime fechaImportacion = LocalDateTime.now();

    @Column(name = "mp_account_id")
    private String mpAccountId;

    // Constructor por defecto
    public MpImportedPayment() {}

    // Constructor para crear desde un Registro
    public MpImportedPayment(registro.cargarDatos.models.Movimiento movimiento, String mpPaymentId, UUID usuarioId, String mpAccountId) {
        this.registroId = movimiento.getId();
        this.mpPaymentId = mpPaymentId;
        this.tipo = movimiento.getTipo();
        this.montoTotal = BigDecimal.valueOf(movimiento.getMontoTotal());
        this.fechaEmision = movimiento.getFechaEmision() != null ? movimiento.getFechaEmision().toLocalDate() : null;
        this.descripcion = movimiento.getDescripcion();
        this.medioPago = movimiento.getMedioPago();
        this.moneda = movimiento.getMoneda();
        this.categoria = movimiento.getCategoria();
        this.origen = movimiento.getOrigenNombre(); // Mapeo desde origenNombre
        this.usuarioId = usuarioId;
        this.mpAccountId = mpAccountId;
    }
}
