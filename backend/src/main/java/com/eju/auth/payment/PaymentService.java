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

        if (isDemoMode()) {
            Payment p = new Payment();
            p.setApplicationId(app.getId());
            p.setSenderInvoiceNo(senderNo);
            p.setQpayInvoiceId("DEMO-" + app.getId());
            p.setQrText("QPAY2:" + senderNo + ":" + props.getExamFee());
            p.setQrImage(demoQrImage(senderNo));
            p.setDeeplinksJson("[]");
            p.setAmount(props.getExamFee());
            p.setStatus(Payment.Status.NEW);
            p = paymentRepo.save(p);
            return toResponse(p);
        }

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
        if (isDemoInvoice(p)) {
            return toResponse(p);
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
        if (isDemoInvoice(p)) {
            markPaid(app, p);
            return;
        }
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

    public synchronized Map<String, Object> completeDemoPayment(Application app) {
        Payment p = paymentRepo.findFirstByApplicationIdOrderByCreatedAtDesc(app.getId()).orElse(null);
        if (p == null) {
            getOrCreateInvoice(app);
            p = paymentRepo.findFirstByApplicationIdOrderByCreatedAtDesc(app.getId()).orElse(null);
        }
        if (p == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found");
        }
        if (!isDemoInvoice(p)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Demo payment is not enabled");
        }
        markPaid(app, p);
        return toResponse(p);
    }

    private void markPaid(Application app, Payment p) {
        p.setStatus(Payment.Status.PAID);
        p.setPaidAt(Instant.now());
        paymentRepo.save(p);
        app.setPaymentStatus(Application.PaymentStatus.PAID);
        if (app.getStatus() == Application.Status.PENDING_PAYMENT || app.getStatus() == Application.Status.PENDING) {
            app.setStatus(Application.Status.APPROVED);
        }
        appRepo.save(app);
    }

    private boolean isDemoMode() {
        return isBlank(props.getUsername()) || isBlank(props.getPassword()) || isBlank(props.getInvoiceCode());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean isDemoInvoice(Payment p) {
        return p.getQpayInvoiceId() != null && p.getQpayInvoiceId().startsWith("DEMO-");
    }

    private String demoQrImage(String senderNo) {
        String label = senderNo.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        String svg = """
                <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
                  <rect width="240" height="240" fill="white"/>
                  <rect x="20" y="20" width="54" height="54" fill="#111827"/>
                  <rect x="32" y="32" width="30" height="30" fill="white"/>
                  <rect x="166" y="20" width="54" height="54" fill="#111827"/>
                  <rect x="178" y="32" width="30" height="30" fill="white"/>
                  <rect x="20" y="166" width="54" height="54" fill="#111827"/>
                  <rect x="32" y="178" width="30" height="30" fill="white"/>
                  <g fill="#111827">
                    <rect x="94" y="28" width="14" height="14"/><rect x="122" y="28" width="14" height="14"/><rect x="94" y="56" width="14" height="14"/>
                    <rect x="88" y="92" width="16" height="16"/><rect x="116" y="92" width="16" height="16"/><rect x="144" y="92" width="16" height="16"/><rect x="200" y="92" width="16" height="16"/>
                    <rect x="88" y="120" width="16" height="16"/><rect x="144" y="120" width="16" height="16"/><rect x="172" y="120" width="16" height="16"/>
                    <rect x="92" y="152" width="14" height="14"/><rect x="120" y="152" width="14" height="14"/><rect x="148" y="152" width="14" height="14"/><rect x="176" y="152" width="14" height="14"/>
                    <rect x="92" y="180" width="14" height="14"/><rect x="148" y="180" width="14" height="14"/><rect x="204" y="180" width="14" height="14"/>
                    <rect x="120" y="204" width="14" height="14"/><rect x="176" y="204" width="14" height="14"/>
                  </g>
                  <text x="120" y="232" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#111827">QPay2</text>
                </svg>
                """;
        return "data:image/svg+xml;base64," + java.util.Base64.getEncoder()
                .encodeToString(svg.getBytes(java.nio.charset.StandardCharsets.UTF_8));
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
        m.put("demo", isDemoInvoice(p));
        return m;
    }
}
