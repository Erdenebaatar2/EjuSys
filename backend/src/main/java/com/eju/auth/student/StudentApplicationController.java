package com.eju.auth.student;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;
import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
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

    public StudentApplicationController(ApplicationRepository appRepo,
                                        ExamRepository examRepo,
                                        ProfileRepository profileRepo) {
        this.appRepo = appRepo;
        this.examRepo = examRepo;
        this.profileRepo = profileRepo;
    }

    public record ApplicationPayload(
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
            Boolean jassoScholarshipApply,
            String examSite
    ) {}

    @GetMapping
    public ResponseEntity<?> getMyApplication(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return appRepo.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ApplicationPayload payload, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        Optional<Exam> activeExam = activeExam();
        if (activeExam.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No active exam is available"));
        }
        if (appRepo.findFirstByUserIdOrderByCreatedAtDesc(userId).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Application already exists"));
        }
        String validationError = validatePayload(payload);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationError));
        }

        Application app = new Application();
        app.setUserId(userId);
        app.setExamId(activeExam.get().getId());
        applyPayload(app, payload);
        app = appRepo.save(app);
        return ResponseEntity.ok(toDto(app));
    }

    @PatchMapping
    public ResponseEntity<?> update(@RequestBody ApplicationPayload payload, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        Optional<Application> existing = appRepo.findFirstByUserIdOrderByCreatedAtDesc(userId);
        if (existing.isEmpty()) return ResponseEntity.notFound().build();

        Application app = existing.get();
        if (app.getStatus() != Application.Status.PENDING) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only pending applications can be updated"));
        }

        String validationError = validatePayload(payload);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationError));
        }

        applyPayload(app, payload);
        app = appRepo.save(app);
        return ResponseEntity.ok(toDto(app));
    }

    private Optional<Exam> activeExam() {
        LocalDate today = LocalDate.now();
        return examRepo.findFirstByActiveTrue()
                .filter(e -> !e.getRegistrationEnd().isBefore(today));
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
        if (subjectMathematics && (payload.mathCourse() == null || payload.mathCourse().isBlank())) {
            return "Math course is required";
        }
        return null;
    }

    private void applyPayload(Application app, ApplicationPayload payload) {
        app.setPhotoUrl(payload.photoUrl());
        app.setNameAlphabet(payload.nameAlphabet());
        app.setNameKanji(payload.nameKanji());
        app.setSex(parseSex(payload.sex()));
        app.setDateOfBirth(payload.dateOfBirth());
        app.setNationality(payload.nationality());
        app.setCountryCode(payload.countryCode());
        app.setAddress(payload.address());
        app.setPostalCode(payload.postalCode());
        app.setAddressCode(payload.addressCode());
        app.setTelephone(payload.telephone());
        app.setMobilePhone(payload.mobilePhone());
        app.setPhone(payload.mobilePhone() != null ? payload.mobilePhone() : payload.telephone());
        app.setSchoolOrOccupation(payload.schoolOrOccupation());

        app.setSubjectJapanese(payload.subjectJapanese() != null && payload.subjectJapanese());
        app.setSubjectScience(payload.subjectScience() != null && payload.subjectScience());
        app.setSubjectJapanAndWorld(payload.subjectJapanAndWorld() != null && payload.subjectJapanAndWorld());
        app.setSubjectMathematics(payload.subjectMathematics() != null && payload.subjectMathematics());
        app.setScienceOption1(parseScience(payload.scienceOption1()));
        app.setScienceOption2(parseScience(payload.scienceOption2()));
        app.setMathCourse(parseMathCourse(payload.mathCourse()));
        app.setExamLanguage(parseExamLanguage(payload.examLanguage()));
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
        map.put("status", app.getStatus().name().toLowerCase());
        map.put("paymentStatus", app.getPaymentStatus().name().toLowerCase());
        map.put("createdAt", app.getCreatedAt());
        map.put("updatedAt", app.getUpdatedAt());
        map.put("photoUrl", app.getPhotoUrl());
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
        map.put("schoolOrOccupation", app.getSchoolOrOccupation());
        map.put("subjectJapanese", app.isSubjectJapanese());
        map.put("subjectScience", app.isSubjectScience());
        map.put("subjectJapanAndWorld", app.isSubjectJapanAndWorld());
        map.put("subjectMathematics", app.isSubjectMathematics());
        map.put("scienceOption1", app.getScienceOption1() != null ? app.getScienceOption1().name() : null);
        map.put("scienceOption2", app.getScienceOption2() != null ? app.getScienceOption2().name() : null);
        map.put("mathCourse", app.getMathCourse() != null ? app.getMathCourse().name() : null);
        map.put("examLanguage", app.getExamLanguage() != null ? app.getExamLanguage().name() : null);
        map.put("jassoScholarshipApply", app.isJassoScholarshipApply());
        map.put("examSite", app.getExamSite() != null ? app.getExamSite().name() : null);
        map.put("rejectionReason", app.getRejectionReason());

        profileRepo.findById(app.getUserId()).ifPresent(profile -> map.put("profile", profileToMap(profile)));
        examRepo.findById(app.getExamId()).ifPresent(exam -> map.put("exam", examToMap(exam)));

        return map;
    }

    private Map<String, Object> profileToMap(Profile profile) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", profile.getId());
        map.put("firstName", profile.getFirstName());
        map.put("lastName", profile.getLastName());
        map.put("email", profile.getEmail());
        map.put("passportNumber", profile.getPassportNumber());
        return map;
    }

    private Map<String, Object> examToMap(Exam exam) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", exam.getId());
        map.put("name", exam.getName());
        map.put("year", exam.getYear());
        map.put("session", exam.getSession().name().toLowerCase());
        map.put("examDate", exam.getExamDate());
        map.put("location", exam.getLocation());
        map.put("registrationStart", exam.getRegistrationStart());
        map.put("registrationEnd", exam.getRegistrationEnd());
        return map;
    }
}
