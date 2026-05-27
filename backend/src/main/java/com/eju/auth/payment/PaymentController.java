package com.eju.auth.payment;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/application/{id}/payment")
public class PaymentController {

    private final PaymentService service;
    private final ApplicationRepository appRepo;

    public PaymentController(PaymentService service, ApplicationRepository appRepo) {
        this.service = service;
        this.appRepo = appRepo;
    }

    private Application ownedApp(UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        Application app = appRepo.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        if (!app.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your application");
        }
        return app;
    }

    @PostMapping("/qpay")
    public ResponseEntity<?> create(@PathVariable UUID id, Authentication auth) {
        Application app = ownedApp(id, auth);
        if (app.getPaymentStatus() == Application.PaymentStatus.PAID) {
            return ResponseEntity.badRequest().body(Map.of("message", "Already paid"));
        }
        return ResponseEntity.ok(service.getOrCreateInvoice(app));
    }

    @GetMapping("/qpay/status")
    public ResponseEntity<?> status(@PathVariable UUID id, Authentication auth) {
        Application app = ownedApp(id, auth);
        return ResponseEntity.ok(service.refreshAndGet(app));
    }
}
