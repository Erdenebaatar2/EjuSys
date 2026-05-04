package com.eju.auth.admin;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;
import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/applications")
public class AdminApplicationController {

    private final ApplicationRepository appRepo;
    private final ProfileRepository profileRepo;
    private final ExamRepository examRepo;

    public AdminApplicationController(ApplicationRepository appRepo,
                                      ProfileRepository profileRepo,
                                      ExamRepository examRepo) {
        this.appRepo = appRepo;
        this.profileRepo = profileRepo;
        this.examRepo = examRepo;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID examId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Application.Status st = (status == null || status.isBlank())
                ? null : Application.Status.valueOf(status.toUpperCase());
        Page<Application> result = appRepo.search(st, examId,
                (search == null || search.isBlank()) ? null : search,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<Map<String, Object>> items = result.getContent().stream().map(this::enrich).toList();
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("items", items);
        resp.put("total", result.getTotalElements());
        resp.put("page", page);
        resp.put("size", size);
        return resp;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable UUID id) {
        return appRepo.findById(id)
                .map(a -> ResponseEntity.ok(enrich(a)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public record StatusBody(String reason) {}
    public record PaymentBody(String status) {}

    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable UUID id) {
        return appRepo.findById(id).<ResponseEntity<?>>map(a -> {
            if (a.getStatus() != Application.Status.APPROVED) {
                a.setStatus(Application.Status.APPROVED);
                a.setRejectionReason(null);
                appRepo.save(a);
                examRepo.findById(a.getExamId()).ifPresent(ex -> {
                    ex.setAvailableSeats(Math.max(0, ex.getAvailableSeats() - 1));
                    examRepo.save(ex);
                });
            }
            return ResponseEntity.ok(enrich(a));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable UUID id, @RequestBody StatusBody body) {
        return appRepo.findById(id).<ResponseEntity<?>>map(a -> {
            boolean wasApproved = a.getStatus() == Application.Status.APPROVED;
            a.setStatus(Application.Status.REJECTED);
            a.setRejectionReason(body.reason());
            appRepo.save(a);
            if (wasApproved) {
                examRepo.findById(a.getExamId()).ifPresent(ex -> {
                    ex.setAvailableSeats(ex.getAvailableSeats() + 1);
                    examRepo.save(ex);
                });
            }
            return ResponseEntity.ok(enrich(a));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/payment")
    public ResponseEntity<?> setPayment(@PathVariable UUID id, @RequestBody PaymentBody body) {
        return appRepo.findById(id).<ResponseEntity<?>>map(a -> {
            a.setPaymentStatus(Application.PaymentStatus.valueOf(body.status().toUpperCase()));
            appRepo.save(a);
            return ResponseEntity.ok(enrich(a));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    private Map<String, Object> enrich(Application a) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", a.getId());
        m.put("applicationNumber", a.getApplicationNumber());
        m.put("status", a.getStatus().name().toLowerCase());
        m.put("paymentStatus", a.getPaymentStatus().name().toLowerCase());
        m.put("phone", a.getPhone());
        m.put("address", a.getAddress());
        m.put("targetUniversity", a.getTargetUniversity());
        m.put("rejectionReason", a.getRejectionReason());
        m.put("passportScanPath", a.getPassportScanPath());
        m.put("photoPath", a.getPhotoPath());
        m.put("createdAt", a.getCreatedAt());
        m.put("userId", a.getUserId());
        m.put("examId", a.getExamId());

        Profile p = profileRepo.findById(a.getUserId()).orElse(null);
        if (p != null) {
            Map<String, Object> pm = new HashMap<>();
            pm.put("firstName", p.getFirstName());
            pm.put("lastName", p.getLastName());
            pm.put("email", p.getEmail());
            pm.put("phone", p.getPhone());
            pm.put("passportNumber", p.getPassportNumber());
            m.put("profile", pm);
        }
        Exam e = examRepo.findById(a.getExamId()).orElse(null);
        if (e != null) {
            Map<String, Object> em = new HashMap<>();
            em.put("name", e.getName());
            em.put("year", e.getYear());
            em.put("session", e.getSession().name().toLowerCase());
            em.put("examDate", e.getExamDate());
            em.put("location", e.getLocation());
            m.put("exam", em);
        }
        return m;
    }
}
