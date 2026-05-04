package com.eju.auth.admin;

import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/exams")
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
    public List<Exam> list() {
        return examRepo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Exam> get(@PathVariable UUID id) {
        return examRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Exam create(@RequestBody ExamRequest req) {
        Exam e = new Exam();
        applyRequest(e, req, true);
        return examRepo.save(e);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Exam> update(@PathVariable UUID id, @RequestBody ExamRequest req) {
        return examRepo.findById(id).map(e -> {
            applyRequest(e, req, false);
            return ResponseEntity.ok(examRepo.save(e));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!examRepo.existsById(id)) return ResponseEntity.notFound().build();
        examRepo.deleteById(id);
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
