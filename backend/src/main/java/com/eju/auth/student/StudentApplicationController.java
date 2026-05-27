package com.eju.auth.student;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationNumberService;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;
import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/application")
public class StudentApplicationController {

    private final ApplicationRepository appRepo;
    private final ExamRepository examRepo;
    private final ProfileRepository profileRepo;
    private final ApplicationNumberService applicationNumberService;

    public StudentApplicationController(ApplicationRepository appRepo,
                                        ExamRepository examRepo,
                                        ProfileRepository profileRepo,
                                        ApplicationNumberService applicationNumberService) {
        this.appRepo = appRepo;
        this.examRepo = examRepo;
        this.profileRepo = profileRepo;
        this.applicationNumberService = applicationNumberService;
    }

    public record ApplicationPayload(
            UUID examId,
            String photoUrl,
            String nameAlphabet,
            String nameKanji,
            String sex,
            LocalDate dateOfBirth,
            String nationality,
            String countryCode,
            String address,
            String postalCode,
            String addressCode,
            String telephone,
            String mobilePhone,
            String schoolOrOccupation,
            Boolean subjectJapanese,
            Boolean subjectScience,
            Boolean subjectJapanAndWorld,
            Boolean subjectMathematics,
            String scienceOption1,
            String scienceOption2,
            String mathCourse,
            String examLanguage,
            Boolean specialExam,
            String specialSupportNote,
            Boolean jassoScholarshipApply,
            String examSite
    ) {}

    @GetMapping
    public ResponseEntity<?> getMyApplication(@RequestParam(required = false) UUID examId,
                                              Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        if (examId == null) {
            return appRepo.findFirstByUserIdOrderByCreatedAtDesc(userId)
                    .map(this::toDto)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.noContent().build());
        }
        Optional<Exam> exam = currentApplicationExam(examId);
        if (exam.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return appRepo.findByUserIdAndExamId(userId, exam.get().getId())
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/all")
    public java.util.List<Map<String, Object>> getMyApplications(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return appRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getApplicationDetail(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        Optional<Application> app = appRepo.findById(id)
                .filter(application -> application.getUserId().equals(userId));
        if (app.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(toDto(app.get()));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ApplicationPayload payload, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        Optional<Exam> activeExam = activeExam(payload.examId());
        if (activeExam.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Энэ шалгалтын бүртгэл хаагдсан байна."));
        }
        if (appRepo.findByUserIdAndExamId(userId, activeExam.get().getId()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Application already exists"));
        }
        Profile profile = profileRepo.findById(userId).orElse(null);
        String profileError = validateProfile(profile);
        if (profileError != null) {
            return ResponseEntity.badRequest().body(Map.of("message", profileError));
        }
        String validationError = validatePayload(payload);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationError));
        }

        Application app = new Application();
        app.setUserId(userId);
        app.setExamId(activeExam.get().getId());
        app.setStatus(Application.Status.PENDING);
        applyPayload(app, payload, profile);
        app.setApplicationNumber(applicationNumberService.nextNumber(activeExam.get(), app));
        try {
            app = appRepo.save(app);
        } catch (DataIntegrityViolationException e) {
            if (appRepo.findByUserIdAndExamId(userId, activeExam.get().getId()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Application already exists"));
            }
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Application could not be saved. Please try again."));
        }
        return ResponseEntity.ok(toDto(app));
    }

    @PatchMapping
    public ResponseEntity<?> update(@RequestBody ApplicationPayload payload, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        Optional<Exam> activeExam = activeExam(payload.examId());
        if (activeExam.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Active exam registration is not open"));
        }
        Optional<Application> existing = appRepo.findByUserIdAndExamId(userId, activeExam.get().getId());
        if (existing.isEmpty()) return ResponseEntity.notFound().build();

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Application already exists. Submitted application details cannot be changed."));
    }

    private Optional<Exam> activeExam(UUID examId) {
        LocalDate today = LocalDate.now();
        Optional<Exam> exam = examId != null
                ? examRepo.findById(examId)
                : examRepo.findFirstRegistrationOpen(today);

        return exam.filter(Exam::isActive)
                .filter(e -> !e.getRegistrationStart().isAfter(today))
                .filter(e -> !e.getRegistrationEnd().isBefore(today));
    }

    private Optional<Exam> currentApplicationExam(UUID examId) {
        if (examId != null) {
            return examRepo.findById(examId).filter(Exam::isActive);
        }
        LocalDate today = LocalDate.now();
        Optional<Exam> openExam = examRepo.findFirstRegistrationOpen(today);
        return openExam.or(() -> examRepo.findFirstByActiveTrueOrderByExamDateAsc());
    }

    private String validatePayload(ApplicationPayload payload) {
        boolean subjectJapanese = payload.subjectJapanese() != null && payload.subjectJapanese();
        boolean subjectScience = payload.subjectScience() != null && payload.subjectScience();
        boolean subjectJapanAndWorld = payload.subjectJapanAndWorld() != null && payload.subjectJapanAndWorld();
        boolean subjectMathematics = payload.subjectMathematics() != null && payload.subjectMathematics();

        if (!subjectJapanese && !subjectScience && !subjectJapanAndWorld && !subjectMathematics) {
            return "At least one subject must be selected";
        }
        if (payload.photoUrl() == null || payload.photoUrl().isBlank()) {
            return "Photo is required";
        }
        if (subjectScience && (payload.scienceOption1() == null || payload.scienceOption1().isBlank())) {
            return "Science option is required";
        }
        return null;
    }

    private String validateProfile(Profile profile) {
        if (profile == null) return "Profile is required";
        if (isBlank(profile.getFirstName())
                || isBlank(profile.getLastName())
                || isBlank(profile.getEmail())
                || isBlank(profile.getPhone())
                || isBlank(profile.getAddress())
                || isBlank(profile.getPassportNumber())) {
            return "Profile information is incomplete";
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void applyPayload(Application app, ApplicationPayload payload, Profile profile) {
        app.setPhotoUrl(payload.photoUrl());
        app.setNameAlphabet((profile.getLastName() + " " + profile.getFirstName()).trim());
        app.setNameKanji(null);
        app.setSex(null);
        app.setDateOfBirth(null);
        app.setNationality(null);
        app.setCountryCode("MNG");
        app.setAddress(profile.getAddress());
        app.setPostalCode(null);
        app.setAddressCode(null);
        app.setTelephone(profile.getPhone());
        app.setMobilePhone(profile.getPhone());
        app.setPhone(profile.getPhone());
        app.setSchoolOrOccupation(null);

        app.setSubjectJapanese(payload.subjectJapanese() != null && payload.subjectJapanese());
        app.setSubjectScience(payload.subjectScience() != null && payload.subjectScience());
        app.setSubjectJapanAndWorld(payload.subjectJapanAndWorld() != null && payload.subjectJapanAndWorld());
        app.setSubjectMathematics(payload.subjectMathematics() != null && payload.subjectMathematics());
        app.setScienceOption1(parseScience(payload.scienceOption1()));
        app.setScienceOption2(parseScience(payload.scienceOption2()));
        app.setMathCourse(null);
        app.setExamLanguage(parseExamLanguage(payload.examLanguage()));
        app.setSpecialExam(payload.specialExam());
        app.setSpecialSupportNote(Boolean.TRUE.equals(payload.specialExam()) ? blankToNull(payload.specialSupportNote()) : null);
        app.setJassoScholarshipApply(payload.jassoScholarshipApply() != null && payload.jassoScholarshipApply());
        app.setExamSite(parseExamSite(payload.examSite()));
        app.setPhotoPath(payload.photoUrl());
    }

    private Application.Sex parseSex(String value) {
        if (value == null || value.isBlank()) return null;
        return Application.Sex.valueOf(value.toUpperCase());
    }

    private Application.ScienceOption parseScience(String value) {
        if (value == null || value.isBlank()) return null;
        return Application.ScienceOption.valueOf(value.toUpperCase());
    }

    private Application.MathCourse parseMathCourse(String value) {
        if (value == null || value.isBlank()) return null;
        return Application.MathCourse.valueOf(value.toUpperCase());
    }

    private Application.ExamLanguage parseExamLanguage(String value) {
        if (value == null || value.isBlank()) return null;
        return Application.ExamLanguage.valueOf(value.toUpperCase());
    }

    private Application.ExamSite parseExamSite(String value) {
        if (value == null || value.isBlank()) return null;
        return Application.ExamSite.valueOf(value.toUpperCase());
    }

    private Map<String, Object> toDto(Application app) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", app.getId());
        map.put("applicationNumber", app.getApplicationNumber());
        map.put("status", displayStatus(app));
        map.put("paymentStatus", app.getPaymentStatus().name().toLowerCase());
        map.put("createdAt", app.getCreatedAt());
        map.put("updatedAt", app.getUpdatedAt());
        map.put("photoUrl", app.getPhotoUrl());
        map.put("photoPath", app.getPhotoPath());
        map.put("nameAlphabet", app.getNameAlphabet());
        map.put("nameKanji", app.getNameKanji());
        map.put("sex", app.getSex() != null ? app.getSex().name() : null);
        map.put("dateOfBirth", app.getDateOfBirth());
        map.put("nationality", app.getNationality());
        map.put("countryCode", app.getCountryCode());
        map.put("address", app.getAddress());
        map.put("postalCode", app.getPostalCode());
        map.put("addressCode", app.getAddressCode());
        map.put("telephone", app.getTelephone());
        map.put("mobilePhone", app.getMobilePhone());
        map.put("phone", app.getPhone());
        map.put("schoolOrOccupation", app.getSchoolOrOccupation());
        map.put("subjectJapanese", app.isSubjectJapanese());
        map.put("subjectScience", app.isSubjectScience());
        map.put("subjectJapanAndWorld", app.isSubjectJapanAndWorld());
        map.put("subjectMathematics", app.isSubjectMathematics());
        map.put("scienceOption1", app.getScienceOption1() != null ? app.getScienceOption1().name() : null);
        map.put("scienceOption2", app.getScienceOption2() != null ? app.getScienceOption2().name() : null);
        map.put("mathCourse", app.getMathCourse() != null ? app.getMathCourse().name() : null);
        map.put("examLanguage", app.getExamLanguage() != null ? app.getExamLanguage().name() : null);
        map.put("specialExam", app.isSpecialExam());
        map.put("specialSupportNote", app.getSpecialSupportNote());
        map.put("jassoScholarshipApply", app.isJassoScholarshipApply());
        map.put("examSite", app.getExamSite() != null ? app.getExamSite().name() : null);
        map.put("rejectionReason", app.getRejectionReason());

        profileRepo.findById(app.getUserId()).ifPresent(profile -> map.put("profile", profileToMap(profile)));
        examRepo.findById(app.getExamId()).ifPresent(exam -> map.put("exam", examToMap(exam)));
        map.put("subjects", subjectsToList(app));

        return map;
    }

    private java.util.List<Map<String, Object>> subjectsToList(Application app) {
        java.util.List<Map<String, Object>> subjects = new java.util.ArrayList<>();
        if (app.isSubjectJapanese()) {
            subjects.add(subjectMap("J1", "Япон хэл", "日本語", "japanese"));
        }
        if (app.isSubjectScience()) {
            if (app.getScienceOption1() != null) {
                subjects.add(scienceSubjectMap(app.getScienceOption1()));
            } else {
                subjects.add(subjectMap("SCI", "Байгалийн ухаан", "理科", "science"));
            }
            if (app.getScienceOption2() != null) {
                subjects.add(scienceSubjectMap(app.getScienceOption2()));
            }
        }
        if (app.isSubjectJapanAndWorld()) {
            subjects.add(subjectMap("GEN", "Япон ба дэлхий", "総合科目", "general"));
        }
        if (app.isSubjectMathematics()) {
            subjects.add(subjectMap("K1", "Математик", "数学", "math"));
        }
        return subjects;
    }

    private Map<String, Object> scienceSubjectMap(Application.ScienceOption option) {
        return switch (option) {
            case PHYSICS -> subjectMap("PHY", "Физик", "物理", "science");
            case CHEMISTRY -> subjectMap("CHEM", "Хими", "化学", "science");
            case BIOLOGY -> subjectMap("BIO", "Биологи", "生物", "science");
        };
    }

    private Map<String, Object> subjectMap(String code, String nameMn, String nameJa, String category) {
        Map<String, Object> subject = new HashMap<>();
        subject.put("code", code);
        subject.put("nameMn", subjectNameMn(code, nameMn));
        subject.put("nameJa", subjectNameJa(code, nameJa));
        subject.put("category", category);
        return subject;
    }

    private String subjectNameMn(String code, String fallback) {
        return switch (code) {
            case "J1", "J2" -> "Япон хэл";
            case "SCI" -> "Байгалийн ухаан";
            case "GEN" -> "Япон ба дэлхий";
            case "K1", "K2" -> "Математик";
            case "PHY" -> "Физик";
            case "CHEM" -> "Хими";
            case "BIO" -> "Биологи";
            default -> fallback;
        };
    }

    private String subjectNameJa(String code, String fallback) {
        return switch (code) {
            case "J1", "J2" -> "日本語";
            case "SCI" -> "理科";
            case "GEN" -> "総合科目";
            case "K1", "K2" -> "数学";
            case "PHY" -> "物理";
            case "CHEM" -> "化学";
            case "BIO" -> "生物";
            default -> fallback;
        };
    }

    private String displayStatus(Application app) {
        if (app.getPaymentStatus() == Application.PaymentStatus.UNPAID
                && app.getStatus() == Application.Status.PENDING) {
            return "pending_payment";
        }
        return app.getStatus().name().toLowerCase();
    }

    private Map<String, Object> profileToMap(Profile profile) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", profile.getId());
        map.put("firstName", profile.getFirstName());
        map.put("lastName", profile.getLastName());
        map.put("email", profile.getEmail());
        map.put("phone", profile.getPhone());
        map.put("address", profile.getAddress());
        map.put("passportNumber", profile.getPassportNumber());
        return map;
    }

    private Map<String, Object> examToMap(Exam exam) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", exam.getId());
        map.put("name", exam.getName());
        map.put("year", exam.getYear());
        map.put("session", exam.getSession().name().toLowerCase());
        map.put("examRound", exam.getExamRound());
        map.put("examDate", exam.getExamDate());
        map.put("location", exam.getLocation());
        map.put("examHost", exam.getExamHost() == null ? null : exam.getExamHost().name());
        map.put("hostCity", exam.getExamHost() == null ? exam.getLocation() : exam.getExamHost().getDisplayName());
        map.put("examFee", exam.getExamFee());
        map.put("registrationStart", exam.getRegistrationStart());
        map.put("registrationEnd", exam.getRegistrationEnd());
        return map;
    }
}
