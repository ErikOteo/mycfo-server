package registro.mercadopago.models;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="mp_payment_factura", uniqueConstraints=@UniqueConstraint(columnNames={"mp_payment_id"}))
public class MpPaymentFactura {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @OneToOne(optional=false) private MpPayment mpPayment;
    @Column(nullable=false) private Long facturaId;
    @Column(nullable=false) private Instant linkedAt;
    // getters/setters
    public Long getId(){return id;} public void setId(Long v){this.id=v;}
    public MpPayment getMpPayment(){return mpPayment;} public void setMpPayment(MpPayment v){this.mpPayment=v;}
    public Long getFacturaId(){return facturaId;} public void setFacturaId(Long v){this.facturaId=v;}
    public Instant getLinkedAt(){return linkedAt;} public void setLinkedAt(Instant v){this.linkedAt=v;}
}
