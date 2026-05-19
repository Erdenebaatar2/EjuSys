package com.eju.auth.payment;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/qpay")
public class QPayCallbackController {

    private final PaymentService service;

    public QPayCallbackController(PaymentService service) {
        this.service = service;
    }

    /** QPay calls this URL after a successful payment.
     *  We re-verify via /payment/check (source of truth). */
    @RequestMapping(value = "/callback", method = { RequestMethod.GET, RequestMethod.POST })
    public ResponseEntity<?> callback(@RequestParam("application_id") UUID applicationId) {
        service.markPaidByApplicationId(applicationId);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
