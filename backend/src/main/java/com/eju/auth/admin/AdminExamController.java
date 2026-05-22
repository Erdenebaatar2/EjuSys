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
            LocalDate examDate,
            String location,
            Integer totalSeats,
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
        e.setName(req.name());
        e.setYear(req.year());
        e.setSession(Exam.Session.valueOf(req.session().toUpperCase()));
        e.setExamDate(req.examDate());
        e.setLocation(req.location());
        e.setTotalSeats(totalSeats);
        if (isNew || totalSeats == 0) {
            e.setAvailableSeats(totalSeats);
        }
        e.setRegistrationStart(req.registrationStart());
        e.setRegistrationEnd(req.registrationEnd());
        e.setDescription(req.description());
        e.setExamInfoLocation(req.examInfoLocation());
        e.setExamInfoStartTime(req.examInfoStartTime());
        e.setExamInfoMethod(req.examInfoMethod());
        e.setExamInfoDurationMinutes(req.examInfoDurationMinutes());
        e.setActive(req.isActive() == null || req.isActive());
    }
}
