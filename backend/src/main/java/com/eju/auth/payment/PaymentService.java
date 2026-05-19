package com.eju.auth.payment;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepo;
    private final ApplicationRepository appRepo;
    private final QPayClient qpay;
    private final QPayProperties props;

    public PaymentService(PaymentRepository paymentRepo,
                          ApplicationRepository appRepo,
                          QPayClient qpay,
                          QPayProperties props) {
        this.paymentRepo = paymentRepo;
        this.appRepo = appRepo;
        this.qpay = qpay;
        this.props = props;
    }

    public Map<String, Object> getOrCreateInvoice(Application app) {
        Payment existing = paymentRepo.findFirstByApplicationIdOrderByCreatedAtDesc(app.getId()).orElse(null);
        if (existing != null && existing.getStatus() == Payment.Status.NEW
                && existing.getQpayInvoiceId() != null) {
            return toResponse(existing);
        }

        String senderNo = app.getApplicationNumber() == null
                ? "EJU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
                : app.getApplicationNumber();

        String callback = props.getCallbackUrl();
        if (callback != null && !callback.isBlank()) {
            callback = callback + (callback.contains("?") ? "&" : "?") + "application_id=" + app.getId();
        }

        JsonNode resp = qpay.createInvoice(
                senderNo,
                app.getUserId().toString(),
                "EJU Exam fee — " + senderNo,
                props.getExamFee(),
                callback == null ? "" : callback);

        if (resp == null || !resp.hasNonNull("invoice_id")) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "QPay invoice response invalid");
        }

        Payment p = new Payment();
        p.setApplicationId(app.getId());
        p.setSenderInvoiceNo(senderNo);
        p.setQpayInvoiceId(resp.get("invoice_id").asText());
        p.setQrText(resp.path("qr_text").asText(null));
        p.setQrImage(resp.path("qr_image").asText(null));
        p.setDeeplinksJson(resp.has("urls") ? resp.get("urls").toString() : "[]");
        p.setAmount(props.getExamFee());
        p.setStatus(Payment.Status.NEW);
        p = paymentRepo.save(p);
        return toResponse(p);
    }

    public Map<String, Object> refreshAndGet(Application app) {
        Payment p = paymentRepo.findFirstByApplicationIdOrderByCreatedAtDesc(app.getId()).orElse(null);
        if (p == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found");
        }
        if (p.getStatus() == Payment.Status.NEW && p.getQpayInvoiceId() != null) {
            try {
                JsonNode resp = qpay.checkPayment(p.getQpayInvoiceId());
                int count = resp.path("count").asInt(0);
                String paymentStatus = resp.path("rows").isArray() && resp.path("rows").size() > 0
                        ? resp.path("rows").get(0).path("payment_status").asText("")
                        : "";
                if (count > 0 && "PAID".equalsIgnoreCase(paymentStatus)) {
                    markPaid(app, p);
                }
            } catch (Exception ignored) {
                // best-effort; client can retry
            }
        }
        return toResponse(p);
    }

    public synchronized void markPaidByApplicationId(UUID applicationId) {
        Application app = appRepo.findById(applicationId).orElse(null);
        if (app == null) return;
        Payment p = paymentRepo.findFirstByApplicationIdOrderByCreatedAtDesc(applicationId).orElse(null);
        if (p == null || p.getStatus() == Payment.Status.PAID) return;
        try {
            JsonNode resp = qpay.checkPayment(p.getQpayInvoiceId());
            int count = resp.path("count").asInt(0);
            String paymentStatus = resp.path("rows").isArray() && resp.path("rows").size() > 0
                    ? resp.path("rows").get(0).path("payment_status").asText("")
                    : "";
            if (count > 0 && "PAID".equalsIgnoreCase(paymentStatus)) {
                markPaid(app, p);
            }
        } catch (Exception ignored) { }
    }

    private void markPaid(Application app, Payment p) {
        p.setStatus(Payment.Status.PAID);
        p.setPaidAt(Instant.now());
        paymentRepo.save(p);
        app.setPaymentStatus(Application.PaymentStatus.PAID);
        if (app.getStatus() == Application.Status.PENDING_PAYMENT) {
            app.setStatus(Application.Status.PENDING);
        }
        appRepo.save(app);
    }

    private Map<String, Object> toResponse(Payment p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("paymentId", p.getId());
        m.put("applicationId", p.getApplicationId());
        m.put("invoiceId", p.getQpayInvoiceId());
        m.put("senderInvoiceNo", p.getSenderInvoiceNo());
        m.put("amount", p.getAmount());
        m.put("status", p.getStatus().name());
        m.put("qrText", p.getQrText());
        m.put("qrImage", p.getQrImage());
        m.put("deeplinks", p.getDeeplinksJson());
        m.put("paidAt", p.getPaidAt());
        return m;
    }
}
