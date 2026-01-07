// consolidacion/mercadopago/models/MpWalletMovement.java
package registro.mercadopago.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name="mp_wallet_movement",
        indexes = {
                @Index(name="idx_wallet_movement_id", columnList="mpMovementId", unique = true),
                @Index(name="idx_wallet_movement_date", columnList="dateEvent"),
                @Index(name="idx_wallet_movement_account", columnList="account_link_id")
        })
public class MpWalletMovement {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @ManyToOne(optional=false) private MpAccountLink accountLink;

    /** ID del movimiento en MP (suele ser String, ej B31HQ7A... o numérico) */
    @Column(nullable=false, length=64) private String mpMovementId;

    /** Fecha/hora efectiva del movimiento */
    private Instant dateEvent;

    /** Monto principal (positivo/negativo según el tipo) */
    @Column(precision=18, scale=2) private BigDecimal amount;

    /** Moneda (ARS, BRL, etc.) */
    private String currency;

    /** Tipo/clase (ej: money_in, money_out, transfer, settlement, fee, etc.) */
    private String kind;

    /** Descripción legible (si viene) */
    @Column(length=1024) private String description;

    /** Estado si aplica (ej. settled, pending…) */
    private String status;

    /** JSON crudo para auditoría */
    @Lob @Column(columnDefinition="LONGTEXT") private String rawJson;

    private Instant importedAt; private Instant updatedAt;

    // getters/setters
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public MpAccountLink getAccountLink() { return accountLink; } public void setAccountLink(MpAccountLink a) { this.accountLink = a; }
    public String getMpMovementId() { return mpMovementId; } public void setMpMovementId(String v) { this.mpMovementId = v; }
    public Instant getDateEvent() { return dateEvent; } public void setDateEvent(Instant v) { this.dateEvent = v; }
    public BigDecimal getAmount() { return amount; } public void setAmount(BigDecimal v) { this.amount = v; }
    public String getCurrency() { return currency; } public void setCurrency(String v) { this.currency = v; }
    public String getKind() { return kind; } public void setKind(String v) { this.kind = v; }
    public String getDescription() { return description; } public void setDescription(String v) { this.description = v; }
    public String getStatus() { return status; } public void setStatus(String v) { this.status = v; }
    public String getRawJson() { return rawJson; } public void setRawJson(String v) { this.rawJson = v; }
    public Instant getImportedAt() { return importedAt; } public void setImportedAt(Instant v) { this.importedAt = v; }
    public Instant getUpdatedAt() { return updatedAt; } public void setUpdatedAt(Instant v) { this.updatedAt = v; }
}
