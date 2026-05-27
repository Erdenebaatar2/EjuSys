package com.eju.auth.admin;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.application.ApplicationSubjectRepository;
import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;
import com.eju.auth.payment.PaymentRepository;
import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/applications")
public class AdminApplicationController {

    private final ApplicationRepository appRepo;
    private final ApplicationSubjectRepository appSubjectRepo;
    private final PaymentRepository paymentRepo;
    private final ProfileRepository profileRepo;
    private final ExamRepository examRepo;

    public AdminApplicationController(ApplicationRepository appRepo,
                                      ApplicationSubjectRepository appSubjectRepo,
                                      PaymentRepository paymentRepo,
                                      ProfileRepository profileRepo,
                                      ExamRepository examRepo) {
        this.appRepo = appRepo;
        this.appSubjectRepo = appSubjectRepo;
        this.paymentRepo = paymentRepo;
        this.profileRepo = profileRepo;
        this.examRepo = examRepo;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) UUID examId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Application.Status st = (status == null || status.isBlank())
                ? null : Application.Status.valueOf(status.toUpperCase());
        Application.PaymentStatus ps = (paymentStatus == null || paymentStatus.isBlank())
                ? null : Application.PaymentStatus.valueOf(paymentStatus.toUpperCase());
        Instant from = fromDate == null ? null : fromDate.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = toDate == null ? null : toDate.plusDays(1).atStartOfDay().minusNanos(1).toInstant(ZoneOffset.UTC);
        String searchTerm = search == null ? "" : search.trim().toLowerCase();
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        List<Application> filtered = appRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .filter(a -> st == null || a.getStatus() == st)
                .filter(a -> ps == null || a.getPaymentStatus() == ps)
                .filter(a -> examId == null || examId.equals(a.getExamId()))
                .filter(a -> from == null || !a.getCreatedAt().isBefore(from))
                .filter(a -> to == null || !a.getCreatedAt().isAfter(to))
                .filter(a -> matchesSearch(a, searchTerm))
                .toList();

        int total = filtered.size();
        int fromIndex = Math.min(safePage * safeSize, total);
        int toIndex = Math.min(fromIndex + safeSize, total);
        List<Map<String, Object>> items = filtered.subList(fromIndex, toIndex).stream()
                .map(this::enrich)
                .toList();
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("items", items);
        resp.put("total", total);
        resp.put("page", safePage);
        resp.put("size", safeSize);
        return resp;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable UUID id) {
        return appRepo.findById(id)
                .map(a -> ResponseEntity.ok(enrich(a)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public record PaymentBody(String status) {}

    @PatchMapping("/{id}/payment")
    public ResponseEntity<?> setPayment(@PathVariable UUID id, @RequestBody PaymentBody body) {
        return appRepo.findById(id).<ResponseEntity<?>>map(a -> {
            a.setPaymentStatus(Application.PaymentStatus.valueOf(body.status().toUpperCase()));
            appRepo.save(a);
            return ResponseEntity.ok(enrich(a));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        return appRepo.findById(id).<ResponseEntity<?>>map(a -> {
            if (a.getStatus() == Application.Status.APPROVED || a.getStatus() == Application.Status.CONFIRMED) {
                examRepo.findById(a.getExamId()).ifPresent(ex -> {
                    if (hasSeatLimit(ex)) {
                        ex.setAvailableSeats(ex.getAvailableSeats() + 1);
                        examRepo.save(ex);
                    }
                });
            }
            paymentRepo.deleteByApplicationId(id);
            appSubjectRepo.deleteByIdApplicationId(id);
            appRepo.delete(a);
            return ResponseEntity.noContent().build();
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
        m.put("photoUrl", a.getPhotoUrl());
        m.put("nameAlphabet", a.getNameAlphabet());
        m.put("nameKanji", a.getNameKanji());
        m.put("sex", a.getSex() == null ? null : a.getSex().name().toLowerCase());
        m.put("dateOfBirth", a.getDateOfBirth());
        m.put("nationality", a.getNationality());
        m.put("countryCode", a.getCountryCode());
        m.put("postalCode", a.getPostalCode());
        m.put("addressCode", a.getAddressCode());
        m.put("telephone", a.getTelephone());
        m.put("mobilePhone", a.getMobilePhone());
        m.put("schoolOrOccupation", a.getSchoolOrOccupation());
        m.put("subjectJapanese", a.isSubjectJapanese());
        m.put("subjectScience", a.isSubjectScience());
        m.put("subjectJapanAndWorld", a.isSubjectJapanAndWorld());
        m.put("subjectMathematics", a.isSubjectMathematics());
        m.put("scienceOption1", a.getScienceOption1() == null ? null : a.getScienceOption1().name());
        m.put("scienceOption2", a.getScienceOption2() == null ? null : a.getScienceOption2().name());
        m.put("mathCourse", a.getMathCourse() == null ? null : a.getMathCourse().name());
        m.put("examLanguage", a.getExamLanguage() == null ? null : a.getExamLanguage().name());
        m.put("specialExam", a.isSpecialExam());
        m.put("specialSupportNote", a.getSpecialSupportNote());
        m.put("jassoScholarshipApply", a.isJassoScholarshipApply());
        m.put("examSite", a.getExamSite() == null ? null : a.getExamSite().name());
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
            em.put("examRound", e.getExamRound());
            em.put("examDate", e.getExamDate());
            em.put("location", e.getLocation());
            em.put("examHost", e.getExamHost() == null ? null : e.getExamHost().name());
            em.put("hostCity", e.getExamHost() == null ? e.getLocation() : e.getExamHost().getDisplayName());
            m.put("exam", em);
        }
        return m;
    }

    private boolean hasSeatLimit(Exam exam) {
        return exam.getTotalSeats() != null
                && exam.getTotalSeats() > 0
                && exam.getAvailableSeats() != null;
    }

    private boolean matchesSearch(Application app, String searchTerm) {
        if (searchTerm == null || searchTerm.isBlank()) return true;

        if (contains(app.getApplicationNumber(), searchTerm)
                || contains(app.getId(), searchTerm)
                || contains(app.getUserId(), searchTerm)
                || contains(app.getExamId(), searchTerm)) {
            return true;
        }

        Profile profile = profileRepo.findById(app.getUserId()).orElse(null);
        if (profile != null && (
                contains(profile.getFirstName(), searchTerm)
                        || contains(profile.getLastName(), searchTerm)
                        || contains(profile.getEmail(), searchTerm)
                        || contains(profile.getPassportNumber(), searchTerm)
        )) {
            return true;
        }

        Exam exam = examRepo.findById(app.getExamId()).orElse(null);
        return exam != null && (
                contains(exam.getName(), searchTerm)
                        || contains(exam.getLocation(), searchTerm)
        );
    }

    private boolean contains(Object value, String searchTerm) {
        return value != null && value.toString().toLowerCase().contains(searchTerm);
    }
}
