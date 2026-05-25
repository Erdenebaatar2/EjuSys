package com.eju.auth.admin;

import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/exam")
public class AdminExamController {

    private final ExamRepository examRepo;

    public AdminExamController(ExamRepository examRepo) {
        this.examRepo = examRepo;
    }

    public record ExamRequest(
            String name,
            Integer year,
            String session,        // "FIRST" | "SECOND"
            String examHost,
            String hostCity,
            LocalDate examDate,
            String location,
            Integer totalSeats,
            Integer examFee,
            LocalDate registrationStart,
            LocalDate registrationEnd,
            String description,
            String examInfoLocation,
            LocalTime examInfoStartTime,
            String examInfoMethod,
            Integer examInfoDurationMinutes,
            Boolean isActive
    ) {}

    @GetMapping
    public ResponseEntity<Exam> getCurrent() {
        return examRepo.findFirstByActiveTrueOrderByExamDateAsc()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/all")
    public List<Exam> getAll() {
        return examRepo.findByActiveTrueOrderByExamDateAsc();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ExamRequest req) {
        String validationError = validateCreate(req);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationError));
        }
        Exam e = new Exam();
        applyRequest(e, req, true);
        return ResponseEntity.ok(examRepo.save(e));
    }

    @PatchMapping
    public ResponseEntity<?> update(@RequestBody ExamRequest req) {
        return examRepo.findFirstByActiveTrueOrderByExamDateAsc().<ResponseEntity<?>>map(e -> {
            applyRequest(e, req, false);
            return ResponseEntity.ok(examRepo.save(e));
        }).orElseGet(() -> ResponseEntity.badRequest().body(Map.of("message", "Active exam not found")));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateById(@PathVariable UUID id, @RequestBody ExamRequest req) {
        return examRepo.findById(id).<ResponseEntity<?>>map(e -> {
            applyRequest(e, req, false);
            return ResponseEntity.ok(examRepo.save(e));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping
    public ResponseEntity<?> deleteCurrent() {
        var activeExamOpt = examRepo.findFirstByActiveTrueOrderByExamDateAsc();
        if (activeExamOpt.isEmpty()) return ResponseEntity.notFound().build();
        Exam exam = activeExamOpt.get();
        exam.setActive(false);
        examRepo.save(exam);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteById(@PathVariable UUID id) {
        var examOpt = examRepo.findById(id);
        if (examOpt.isEmpty()) return ResponseEntity.notFound().build();
        Exam exam = examOpt.get();
        exam.setActive(false);
        examRepo.save(exam);
        return ResponseEntity.noContent().build();
    }

    private void applyRequest(Exam e, ExamRequest req, boolean isNew) {
        int totalSeats = req.totalSeats() == null ? 0 : Math.max(0, req.totalSeats());
        int examFee = req.examFee() == null
                ? (e.getExamFee() == null ? 70000 : e.getExamFee())
                : Math.max(1, req.examFee());
        Exam.Session session = Exam.Session.valueOf(req.session().toUpperCase());
        Exam.ExamHost host = parseExamHost(firstNonBlank(req.examHost(), req.hostCity(), req.location()), e.getExamHost());
        e.setYear(req.year());
        e.setSession(session);
        e.setExamHost(host);
        e.setName(defaultExamName(req.year(), session, host));
        e.setExamDate(req.examDate());
        e.setLocation(host.getDisplayName());
        e.setTotalSeats(totalSeats);
        e.setExamFee(examFee);
        if (isNew || totalSeats == 0) {
            e.setAvailableSeats(totalSeats);
        }
        e.setRegistrationStart(req.registrationStart());
        e.setRegistrationEnd(req.registrationEnd());
        e.setDescription(blankToNull(req.description()));
        if (isNew || req.examInfoLocation() != null) {
            e.setExamInfoLocation(blankToNull(req.examInfoLocation()));
        }
        e.setExamInfoStartTime(req.examInfoStartTime());
        e.setExamInfoMethod(req.examInfoMethod());
        e.setExamInfoDurationMinutes(req.examInfoDurationMinutes());
        e.setActive(req.isActive() == null || req.isActive());
    }

    private String validateCreate(ExamRequest req) {
        if (req.year() == null || req.session() == null || req.examDate() == null
                || req.registrationStart() == null || req.registrationEnd() == null) {
            return "Year, session, exam date, and registration dates are required";
        }
        try {
            Exam.Session.valueOf(req.session().toUpperCase());
            parseExamHost(firstNonBlank(req.examHost(), req.hostCity(), req.location()), null);
        } catch (IllegalArgumentException e) {
            return "Invalid exam session or host city";
        }

        LocalDate today = LocalDate.now();
        var unfinishedRegistration = examRepo
                .findByActiveTrueAndRegistrationEndGreaterThanEqualOrderByRegistrationEndAsc(today)
                .stream()
                .findFirst();
        if (unfinishedRegistration.isPresent()) {
            Exam previous = unfinishedRegistration.get();
            return "Cannot create a new exam before the current registration closes: "
                    + previous.getName() + " registration ends on " + previous.getRegistrationEnd();
        }

        Exam.Session session = Exam.Session.valueOf(req.session().toUpperCase());
        if (examRepo.existsByActiveTrueAndYearAndSession(req.year(), session)) {
            return "An active exam already exists for this year and session";
        }

        if (examRepo.countByActiveTrueAndYear(req.year()) >= 2) {
            return "Only two active exams can be created per year";
        }

        if (req.examFee() == null || req.examFee() <= 0) {
            return "Exam fee must be greater than zero";
        }

        return null;
    }

    private Exam.ExamHost parseExamHost(String raw, Exam.ExamHost fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback == null ? Exam.ExamHost.ULAANBAATAR : fallback;
        }
        String normalized = raw.trim().toUpperCase()
                .replace("-", "_")
                .replace(" ", "_");
        if (normalized.equals("УЛААНБААТАР") || normalized.equals("UB") || normalized.equals("ULAANBAATAR")) {
            return Exam.ExamHost.ULAANBAATAR;
        }
        if (normalized.equals("ДАРХАН") || normalized.equals("DARKHAN")) {
            return Exam.ExamHost.DARKHAN;
        }
        if (normalized.equals("ЭРДЭНЭТ") || normalized.equals("ERDENET")) {
            return Exam.ExamHost.ERDENET;
        }
        return Exam.ExamHost.valueOf(normalized);
    }

    private String defaultExamName(Integer year, Exam.Session session, Exam.ExamHost host) {
        String sessionLabel = session == Exam.Session.FIRST ? "1-р шалгалт" : "2-р шалгалт";
        return "EJU " + year + " " + sessionLabel + " - " + host.getDisplayName();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
