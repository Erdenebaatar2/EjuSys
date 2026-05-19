package com.eju.auth.payment;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class Payment {

    public enum Status { NEW, PAID, FAILED }

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "application_id", nullable = false, columnDefinition = "uuid")
    private UUID applicationId;

    @Column(name = "qpay_invoice_id")
    private String qpayInvoiceId;

    @Column(name = "sender_invoice_no", nullable = false)
    private String senderInvoiceNo;

    @Column(name = "qr_text", columnDefinition = "text")
    private String qrText;

    @Column(name = "qr_image", columnDefinition = "text")
    private String qrImage;

    @Column(name = "deeplinks_json", columnDefinition = "text")
    private String deeplinksJson;

    @Column(nullable = false)
    private int amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.NEW;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID v) { this.applicationId = v; }
    public String getQpayInvoiceId() { return qpayInvoiceId; }
    public void setQpayInvoiceId(String v) { this.qpayInvoiceId = v; }
    public String getSenderInvoiceNo() { return senderInvoiceNo; }
    public void setSenderInvoiceNo(String v) { this.senderInvoiceNo = v; }
    public String getQrText() { return qrText; }
    public void setQrText(String v) { this.qrText = v; }
    public String getQrImage() { return qrImage; }
    public void setQrImage(String v) { this.qrImage = v; }
    public String getDeeplinksJson() { return deeplinksJson; }
    public void setDeeplinksJson(String v) { this.deeplinksJson = v; }
    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getPaidAt() { return paidAt; }
    public void setPaidAt(Instant v) { this.paidAt = v; }
}
