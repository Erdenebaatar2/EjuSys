package com.eju.auth.student;

import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/student/exam")
public class StudentExamController {

    private final ExamRepository examRepo;
    private final ApplicationRepository appRepo;

    public StudentExamController(ExamRepository examRepo, ApplicationRepository appRepo) {
        this.examRepo = examRepo;
        this.appRepo = appRepo;
    }

    @GetMapping
    public ResponseEntity<?> getActiveExam(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        LocalDate today = LocalDate.now();
        return examRepo.findFirstByActiveTrue()
                .filter(e -> !e.getRegistrationEnd().isBefore(today))
                .map(e -> {
                    Map<String, Object> result = new HashMap<>(toMap(e));
                    appRepo.findByUserIdAndExamId(userId, e.getId()).ifPresent(a ->
                            result.put("existingApplication", Map.of(
                                    "id", a.getId(),
                                    "applicationNumber", a.getApplicationNumber(),
                                    "status", a.getStatus().name().toLowerCase()
                            ))
                    );
                    return ResponseEntity.ok(result);
                })
                .orElseGet(() -> ResponseEntity.noContent().build());
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
        m.put("isActive", e.isActive());
        m.put("description", e.getDescription());
        return m;
    }
}
