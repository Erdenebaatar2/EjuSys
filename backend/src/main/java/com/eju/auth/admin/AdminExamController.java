package com.eju.auth.admin;

import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

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
            LocalDate examDate,
            String location,
            Integer totalSeats,
            LocalDate registrationStart,
            LocalDate registrationEnd,
            String description,
            Boolean isActive
    ) {}

    @GetMapping
    public ResponseEntity<Exam> getCurrent() {
        return examRepo.findFirstByActiveTrue()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ExamRequest req) {
        if (examRepo.existsByActiveTrue()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Active exam already exists"));
        }
        Exam e = new Exam();
        applyRequest(e, req, true);
        return ResponseEntity.ok(examRepo.save(e));
    }

    @PatchMapping
    public ResponseEntity<?> update(@RequestBody ExamRequest req) {
        return examRepo.findFirstByActiveTrue().<ResponseEntity<?>>map(e -> {
            applyRequest(e, req, false);
            return ResponseEntity.ok(examRepo.save(e));
        }).orElseGet(() -> ResponseEntity.badRequest().body(Map.of("message", "Active exam not found")));
    }

    @DeleteMapping
    public ResponseEntity<?> deleteCurrent() {
        var activeExamOpt = examRepo.findFirstByActiveTrue();
        if (activeExamOpt.isEmpty()) return ResponseEntity.notFound().build();
        Exam exam = activeExamOpt.get();
        exam.setActive(false);
        examRepo.save(exam);
        return ResponseEntity.noContent().build();
    }

    private void applyRequest(Exam e, ExamRequest req, boolean isNew) {
        e.setName(req.name());
        e.setYear(req.year());
        e.setSession(Exam.Session.valueOf(req.session().toUpperCase()));
        e.setExamDate(req.examDate());
        e.setLocation(req.location());
        e.setTotalSeats(req.totalSeats());
        if (isNew) {
            e.setAvailableSeats(req.totalSeats());
        }
        e.setRegistrationStart(req.registrationStart());
        e.setRegistrationEnd(req.registrationEnd());
        e.setDescription(req.description());
        e.setActive(req.isActive() == null ? true : req.isActive());
    }
}
