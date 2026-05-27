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
        Map<UUID, Application> applicationsByExamId = new HashMap<>();
        if (userId != null) {
            appRepo.findByUserId(userId).forEach(app -> applicationsByExamId.put(app.getExamId(), app));
        }

        LocalDate today = LocalDate.now();
        Map<UUID, Exam> examsById = new LinkedHashMap<>();
        examRepo.findByActiveTrueAndRegistrationStartLessThanEqualAndRegistrationEndGreaterThanEqualOrderByExamDateAsc(today, today)
                .forEach(exam -> examsById.put(exam.getId(), exam));

        return examsById.values().stream()
                .sorted(Comparator.comparing(Exam::getExamDate))
                .map(e -> {
                    Map<String, Object> result = new HashMap<>(toMap(e));
                    Application existing = applicationsByExamId.get(e.getId());
                    if (existing != null) {
                        result.put("existingApplication", applicationSummary(existing));
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
        m.put("examHost", e.getExamHost() == null ? null : e.getExamHost().name());
        m.put("hostCity", e.getExamHost() == null ? e.getLocation() : e.getExamHost().getDisplayName());
        m.put("totalSeats", e.getTotalSeats());
        m.put("availableSeats", e.getAvailableSeats());
        m.put("examFee", e.getExamFee());
        m.put("registrationStart", e.getRegistrationStart().toString());
        m.put("registrationEnd", e.getRegistrationEnd().toString());
        m.put("session", e.getSession().name().toLowerCase());
        m.put("year", e.getYear());
        m.put("examRound", e.getExamRound());
        m.put("active", e.isActive());
        m.put("isActive", e.isActive());
        m.put("registrationOpen", e.isActive()
                && !e.getRegistrationStart().isAfter(LocalDate.now())
                && !e.getRegistrationEnd().isBefore(LocalDate.now()));
        m.put("description", e.getDescription());
        m.put("examInfoLocation", e.getExamInfoLocation());
        m.put("examInfoStartTime", e.getExamInfoStartTime() == null ? null : e.getExamInfoStartTime().toString());
        m.put("examInfoMethod", e.getExamInfoMethod());
        m.put("examInfoDurationMinutes", e.getExamInfoDurationMinutes());
        return m;
    }
}
