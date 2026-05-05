package com.eju.auth.student;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.application.ApplicationSubject;
import com.eju.auth.application.ApplicationSubjectRepository;
import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/student/applications")
public class StudentApplicationController {

    private final ApplicationRepository appRepo;
    private final ApplicationSubjectRepository subjectAppRepo;
    private final ExamRepository examRepo;

    public StudentApplicationController(ApplicationRepository appRepo,
                                        ApplicationSubjectRepository subjectAppRepo,
                                        ExamRepository examRepo) {
        this.appRepo = appRepo;
        this.subjectAppRepo = subjectAppRepo;
        this.examRepo = examRepo;
    }

    @GetMapping
    public List<Map<String, Object>> listApplications(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return appRepo.findByUserId(userId).stream()
                .sorted(Comparator.comparing(Application::getCreatedAt).reversed())
                .map(a -> {
                    Map<String, Object> m = new HashMap<>(appToMap(a));
                    examRepo.findById(a.getExamId()).ifPresent(e ->
                            m.put("exam", Map.of(
                                    "name", e.getName(),
                                    "examDate", e.getExamDate().toString(),
                                    "location", e.getLocation()
                            ))
                    );
                    return m;
                })
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getApplication(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return appRepo.findById(id)
                .filter(a -> a.getUserId().equals(userId))
                .map(a -> {
                    Map<String, Object> result = new HashMap<>(appToMap(a));
                    examRepo.findById(a.getExamId()).ifPresent(e ->
                            result.put("exam", Map.of(
                                    "name", e.getName(),
                                    "examDate", e.getExamDate().toString(),
                                    "location", e.getLocation(),
                                    "session", e.getSession().name().toLowerCase(),
                                    "year", e.getYear()
                            ))
                    );
                    List<Map<String, Object>> subjects = subjectAppRepo.findByApplicationId(id)
                            .stream()
                            .map(as -> {
                                Map<String, Object> s = new HashMap<>();
                                s.put("code", as.getSubject().getCode());
                                s.put("nameMn", as.getSubject().getNameMn());
                                s.put("nameJa", as.getSubject().getNameJa());
                                s.put("category", as.getSubject().getCategory());
                                return s;
                            })
                            .toList();
                    result.put("subjects", subjects);
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> submitApplication(@RequestBody Map<String, Object> body, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();

        String examIdStr = (String) body.get("examId");
        if (examIdStr == null) return ResponseEntity.badRequest().body(Map.of("message", "examId required"));

        UUID examId;
        try {
            examId = UUID.fromString(examIdStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "invalid examId"));
        }

        Optional<Exam> examOpt = examRepo.findById(examId);
        if (examOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Exam not found"));

        if (appRepo.findByUserIdAndExamId(userId, examId).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Already applied for this exam"));
        }

        Application app = new Application();
        app.setUserId(userId);
        app.setExamId(examId);
        app.setPhone((String) body.get("phone"));
        app.setAddress((String) body.get("address"));
        app.setTargetUniversity((String) body.get("targetUniversity"));
        app.setPassportScanPath((String) body.get("passportScanPath"));
        app.setPhotoPath((String) body.get("photoPath"));
        app = appRepo.save(app);

        @SuppressWarnings("unchecked")
        List<String> subjectIds = (List<String>) body.getOrDefault("subjectIds", List.of());
        final UUID appId = app.getId();
        for (String sid : subjectIds) {
            try {
                subjectAppRepo.save(new ApplicationSubject(appId, UUID.fromString(sid)));
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(Map.of(
                "id", app.getId(),
                "applicationNumber", app.getApplicationNumber()
        ));
    }

    private Map<String, Object> appToMap(Application a) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", a.getId());
        m.put("applicationNumber", a.getApplicationNumber());
        m.put("status", a.getStatus().name().toLowerCase());
        m.put("paymentStatus", a.getPaymentStatus().name().toLowerCase());
        m.put("createdAt", a.getCreatedAt().toString());
        m.put("examId", a.getExamId());
        if (a.getPhone() != null) m.put("phone", a.getPhone());
        if (a.getAddress() != null) m.put("address", a.getAddress());
        if (a.getTargetUniversity() != null) m.put("targetUniversity", a.getTargetUniversity());
        if (a.getRejectionReason() != null) m.put("rejectionReason", a.getRejectionReason());
        return m;
    }
}
