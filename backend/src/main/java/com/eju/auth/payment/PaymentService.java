package com.eju.auth.payment;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.exam.ExamRepository;
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
    private final ExamRepository examRepo;
    private final QPayClient qpay;
    private final QPayProperties props;

    public PaymentService(PaymentRepository paymentRepo,
                          ApplicationRepository appRepo,
                          ExamRepository examRepo,
                          QPayClient qpay,
                          QPayProperties props) {
        this.paymentRepo = paymentRepo;
        this.appRepo = appRepo;
        this.examRepo = examRepo;
        this.qpay = qpay;
        this.props = props;
    }

    public Map<String, Object> getOrCreateInvoice(Application app) {
        Payment existing = paymentRepo.findFirstByApplicationIdOrderByCreatedAtDesc(app.getId()).orElse(null);
        if (existing != null && (existing.getStatus() == Payment.Status.NEW || existing.getStatus() == Payment.Status.PENDING)
                && existing.getQpayInvoiceId() != null) {
            return toResponse(existing);
        }

        String senderNo = app.getApplicationNumber() == null
                ? "EJU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
                : app.getApplicationNumber();
        int amount = examFeeFor(app);

        String callback = props.getCallbackUrl();
        if (callback != null && !callback.isBlank()) {
            callback = callback + (callback.contains("?") ? "&" : "?") + "application_id=" + app.getId();
        }

        JsonNode resp = qpay.createInvoice(
                senderNo,
                app.getUserId().toString(),
                "EJU Exam fee — " + senderNo,
                amount,
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
        p.setAmount(amount);
        p.setStatus(Payment.Status.PENDING);
        p = paymentRepo.save(p);
        return toResponse(p);
    }

    private int examFeeFor(Application app) {
        return examRepo.findById(app.getExamId())
                .map(exam -> exam.getExamFee() == null || exam.getExamFee() <= 0
                        ? props.getExamFee()
                        : exam.getExamFee())
                .orElse(props.getExamFee());
    }

    public Map<String, Object> refreshAndGet(Application app) {
        Payment p = paymentRepo.findFirstByApplicationIdOrderByCreatedAtDesc(app.getId()).orElse(null);
        if (p == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found");
        }
        if ((p.getStatus() == Payment.Status.NEW || p.getStatus() == Payment.Status.PENDING)
                && p.getQpayInvoiceId() != null) {
            try {
                JsonNode resp = qpay.checkPayment(p.getQpayInvoiceId());
                applyQPayStatus(app, p, resp);
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Төлбөр шалгахад алдаа гарлаа. Дахин оролдоно уу.");
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
            applyQPayStatus(app, p, resp);
        } catch (Exception ignored) { }
    }

    private void applyQPayStatus(Application app, Payment p, JsonNode resp) {
        int count = resp.path("count").asInt(0);
        JsonNode firstRow = resp.path("rows").isArray() && resp.path("rows").size() > 0
                ? resp.path("rows").get(0)
                : null;
        String paymentStatus = firstRow == null ? "" : firstRow.path("payment_status").asText("");
        if (firstRow != null && firstRow.hasNonNull("payment_id")) {
            p.setQpayPaymentId(firstRow.get("payment_id").asText());
        }
        if (count > 0 && "PAID".equalsIgnoreCase(paymentStatus)) {
            markPaid(app, p);
        } else if ("FAILED".equalsIgnoreCase(paymentStatus)) {
            p.setStatus(Payment.Status.FAILED);
            paymentRepo.save(p);
        } else if ("EXPIRED".equalsIgnoreCase(paymentStatus)) {
            p.setStatus(Payment.Status.EXPIRED);
            paymentRepo.save(p);
        } else if (p.getStatus() == Payment.Status.NEW) {
            p.setStatus(Payment.Status.PENDING);
            paymentRepo.save(p);
        }
    }

    private void markPaid(Application app, Payment p) {
        p.setStatus(Payment.Status.PAID);
        p.setPaidAt(Instant.now());
        paymentRepo.save(p);
        app.setPaymentStatus(Application.PaymentStatus.PAID);
        if (app.getStatus() == Application.Status.PENDING_PAYMENT || app.getStatus() == Application.Status.PENDING) {
            app.setStatus(Application.Status.CONFIRMED);
        }
        appRepo.save(app);
    }

    private Map<String, Object> toResponse(Payment p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("paymentId", p.getId());
        m.put("qpayPaymentId", p.getQpayPaymentId());
        m.put("applicationId", p.getApplicationId());
        m.put("invoiceId", p.getQpayInvoiceId());
        m.put("senderInvoiceNo", p.getSenderInvoiceNo());
        m.put("amount", p.getAmount());
        m.put("status", p.getStatus() == Payment.Status.NEW ? "PENDING" : p.getStatus().name());
        m.put("qrText", p.getQrText());
        m.put("qrImage", p.getQrImage());
        m.put("deeplinks", p.getDeeplinksJson());
        m.put("paidAt", p.getPaidAt());
        return m;
    }
}
