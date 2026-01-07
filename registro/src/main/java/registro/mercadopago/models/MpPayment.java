package registro.mercadopago.models;

import registro.mercadopago.models.MpAccountLink;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name="mp_payment",
        indexes = {
                @Index(name="idx_mp_payment_id", columnList="mpPaymentId", unique=true),
                @Index(name="idx_date_approved", columnList="dateApproved"),
                @Index(name="idx_account_link", columnList="account_link_id")
        })
public class MpPayment {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private Long mpPaymentId;

    @ManyToOne(optional=false)
    private MpAccountLink accountLink;
    private String status; private String statusDetail;
    private Instant dateCreated; private Instant dateApproved;

    @Column(precision=18, scale=2)
    private BigDecimal transactionAmount;
    private String currencyId;

    @Column(length=1024)
    private String description;
    private String payerEmail;
    private String paymentMethodId;
    private String orderId;


    @Lob @Column(columnDefinition="LONGTEXT")
    private String rawJson;
    private Instant importedAt;
    private Instant updatedAt;
    // getters/setters


    public Long getId(){return id;} public void setId(Long v){this.id=v;}
    public Long getMpPaymentId(){return mpPaymentId;} public void setMpPaymentId(Long v){this.mpPaymentId=v;}
    public MpAccountLink getAccountLink(){return accountLink;} public void setAccountLink(MpAccountLink v){this.accountLink=v;}
    public String getStatus(){return status;} public void setStatus(String v){this.status=v;}
    public String getStatusDetail(){return statusDetail;} public void setStatusDetail(String v){this.statusDetail=v;}
    public Instant getDateCreated(){return dateCreated;} public void setDateCreated(Instant v){this.dateCreated=v;}
    public Instant getDateApproved(){return dateApproved;} public void setDateApproved(Instant v){this.dateApproved=v;}
    public BigDecimal getTransactionAmount(){return transactionAmount;} public void setTransactionAmount(BigDecimal v){this.transactionAmount=v;}
    public String getCurrencyId(){return currencyId;} public void setCurrencyId(String v){this.currencyId=v;}
    public String getDescription(){return description;} public void setDescription(String v){this.description=v;}
    public String getPayerEmail(){return payerEmail;} public void setPayerEmail(String v){this.payerEmail=v;}
    public String getPaymentMethodId(){return paymentMethodId;} public void setPaymentMethodId(String v){this.paymentMethodId=v;}
    public String getOrderId(){return orderId;} public void setOrderId(String v){this.orderId=v;}
    public String getRawJson(){return rawJson;} public void setRawJson(String v){this.rawJson=v;}
    public Instant getImportedAt(){return importedAt;} public void setImportedAt(Instant v){this.importedAt=v;}
    public Instant getUpdatedAt(){return updatedAt;} public void setUpdatedAt(Instant v){this.updatedAt=v;}
}
