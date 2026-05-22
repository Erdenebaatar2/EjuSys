package com.eju.auth.student;

import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.application.Application;
import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/student")
public class StudentExamController {

    private final ExamRepository examRepo;
    private final ApplicationRepository appRepo;

    public StudentExamController(ExamRepository examRepo, ApplicationRepository appRepo) {
        this.examRepo = examRepo;
        this.appRepo = appRepo;
    }

    @GetMapping("/exam")
    public ResponseEntity<?> getActiveExam(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        LocalDate today = LocalDate.now();
        return examRepo.findFirstRegistrationOpen(today)
                .map(e -> {
                    Map<String, Object> result = new HashMap<>(toMap(e));
                    appRepo.findByUserIdAndExamId(userId, e.getId()).ifPresent(a ->
                            result.put("existingApplication", applicationSummary(a))
                    );
                    return ResponseEntity.ok(result);
                })
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/exams")
    public List<Map<String, Object>> getAvailableExams(Authentication auth) {
        UUID userId = auth == null ? null : (UUID) auth.getPrincipal();
        return examRepo.findByActiveTrueOrderByExamDateAsc()
                .stream()
                .map(e -> {
                    Map<String, Object> result = new HashMap<>(toMap(e));
                    if (userId != null) {
                        appRepo.findByUserIdAndExamId(userId, e.getId())
                                .ifPresent(a -> result.put("existingApplication", applicationSummary(a)));
                    }
                    return result;
                })
                .toList();
    }

    private Map<String, Object> applicationSummary(Application app) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", app.getId());
        m.put("applicationNumber", app.getApplicationNumber());
        m.put("status", displayStatus(app));
        m.put("paymentStatus", app.getPaymentStatus().name().toLowerCase());
        return m;
    }

    private String displayStatus(Application app) {
        if (app.getPaymentStatus() == Application.PaymentStatus.UNPAID
                && app.getStatus() == Application.Status.PENDING) {
            return "pending_payment";
        }
        return app.getStatus().name().toLowerCase();
    }

    private Map<String, Object> toMap(Exam e) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", e.getId());
        m.put("name", e.getName());
        m.put("examDate", e.getExamDate().toString());
        m.put("location", e.getLocation());
        m.put("totalSeats", e.getTotalSeats());
        m.put("availableSeats", e.getAvailableSeats());
        m.put("registrationStart", e.getRegistrationStart().toString());
        m.put("registrationEnd", e.getRegistrationEnd().toString());
        m.put("session", e.getSession().name().toLowerCase());
        m.put("year", e.getYear());
        m.put("active", e.isActive());
        m.put("isActive", e.isActive());
        m.put("description", e.getDescription());
        m.put("examInfoLocation", e.getExamInfoLocation());
        m.put("examInfoStartTime", e.getExamInfoStartTime() == null ? null : e.getExamInfoStartTime().toString());
        m.put("examInfoMethod", e.getExamInfoMethod());
        m.put("examInfoDurationMinutes", e.getExamInfoDurationMinutes());
        return m;
    }
}
