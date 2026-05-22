package com.eju.auth.admin;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;
import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/stats")
public class AdminStatsController {

    private final ApplicationRepository appRepo;
    private final ExamRepository examRepo;
    private final ProfileRepository profileRepo;

    public AdminStatsController(ApplicationRepository appRepo,
                                ExamRepository examRepo,
                                ProfileRepository profileRepo) {
        this.appRepo = appRepo;
        this.examRepo = examRepo;
        this.profileRepo = profileRepo;
    }

    @GetMapping
    public Map<String, Object> stats(@RequestParam(required = false) Integer year,
                                     @RequestParam(required = false) String session,
                                     @RequestParam(required = false) UUID examId) {
        List<Application> applications = appRepo.findAll();
        List<Exam> activeExams = examRepo.findByActiveTrueOrderByExamDateAsc();
        Map<UUID, Exam> examMap = activeExams.stream().collect(Collectors.toMap(Exam::getId, x -> x));
        Map<UUID, Profile> profileMap = profileRepo.findAll().stream().collect(Collectors.toMap(Profile::getId, x -> x));

        List<Application> filtered = applications.stream()
                .filter(a -> {
                    Exam exam = examMap.get(a.getExamId());
                    if (exam == null) return false;
                    if (year != null && !year.equals(exam.getYear())) return false;
                    if (examId != null && !examId.equals(exam.getId())) return false;
                    if (session != null && !session.isBlank()) {
                        String normalized = session.toUpperCase();
                        if (!exam.getSession().name().equals(normalized)) return false;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(Application::getCreatedAt))
                .toList();

        long total = filtered.size();
        long approved = filtered.stream().filter(a -> a.getStatus() == Application.Status.APPROVED).count();
        long pending = filtered.stream().filter(a -> a.getStatus() == Application.Status.PENDING).count();
        long rejected = filtered.stream().filter(a -> a.getStatus() == Application.Status.REJECTED).count();
        long paid = filtered.stream().filter(a -> a.getPaymentStatus() == Application.PaymentStatus.PAID).count();
        long unpaid = total - paid;

        Map<String, Long> monthly = filtered.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getCreatedAt().atZone(ZoneOffset.UTC).format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        Map<String, Long> subjectDistribution = new LinkedHashMap<>();
        subjectDistribution.put("japanese", filtered.stream().filter(Application::isSubjectJapanese).count());
        subjectDistribution.put("science", filtered.stream().filter(Application::isSubjectScience).count());
        subjectDistribution.put("general", filtered.stream().filter(Application::isSubjectJapanAndWorld).count());
        subjectDistribution.put("math", filtered.stream().filter(Application::isSubjectMathematics).count());

        Map<String, Long> locationDistribution = filtered.stream()
                .map(a -> examMap.get(a.getExamId()))
                .filter(e -> e != null && e.getLocation() != null)
                .collect(Collectors.groupingBy(Exam::getLocation, LinkedHashMap::new, Collectors.counting()));

        List<Map<String, Object>> examSeatStats = activeExams.stream()
                .filter(e -> (year == null || year.equals(e.getYear())) && (session == null || session.isBlank() || e.getSession().name().equals(session.toUpperCase())))
                .map(e -> {
                    long registered = filtered.stream().filter(a -> e.getId().equals(a.getExamId())).count();
                    double percent = e.getTotalSeats() == null || e.getTotalSeats() == 0
                            ? 0
                            : (registered * 100.0) / e.getTotalSeats();
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("examId", e.getId());
                    row.put("name", e.getName());
                    row.put("year", e.getYear());
                    row.put("session", e.getSession().name().toLowerCase());
                    row.put("location", e.getLocation());
                    row.put("totalSeats", e.getTotalSeats());
                    row.put("registered", registered);
                    row.put("filledPercent", percent);
                    return row;
                }).toList();

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Application app : filtered) {
            Exam exam = examMap.get(app.getExamId());
            Profile profile = profileMap.get(app.getUserId());
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("applicationNumber", app.getApplicationNumber());
            row.put("status", app.getStatus().name().toLowerCase());
            row.put("paymentStatus", app.getPaymentStatus().name().toLowerCase());
            row.put("createdAt", app.getCreatedAt());
            row.put("nameAlphabet", app.getNameAlphabet());
            row.put("sex", app.getSex() == null ? null : app.getSex().name());
            row.put("dateOfBirth", app.getDateOfBirth());
            row.put("countryCode", app.getCountryCode());
            row.put("addressCode", app.getAddressCode());
            row.put("subjectJapanese", app.isSubjectJapanese());
            row.put("subjectScience", app.isSubjectScience());
            row.put("subjectJapanAndWorld", app.isSubjectJapanAndWorld());
            row.put("subjectMathematics", app.isSubjectMathematics());
            row.put("examLanguage", app.getExamLanguage() == null ? null : app.getExamLanguage().name());
            row.put("jassoScholarshipApply", app.isJassoScholarshipApply());
            row.put("schoolOrOccupation", app.getSchoolOrOccupation());
            row.put("photoUrl", app.getPhotoUrl());
            row.put("profileEmail", profile == null ? null : profile.getEmail());
            row.put("profilePassport", profile == null ? null : profile.getPassportNumber());
            row.put("examName", exam == null ? null : exam.getName());
            row.put("examDate", exam == null ? null : exam.getExamDate());
            row.put("examLocation", exam == null ? null : exam.getLocation());
            row.put("examSession", exam == null ? null : exam.getSession().name().toLowerCase());
            row.put("examYear", exam == null ? null : exam.getYear());
            rows.add(row);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("kpi", Map.of(
                "totalApplications", total,
                "approved", approved,
                "pending", pending,
                "rejected", rejected,
                "paid", paid,
                "unpaid", unpaid
        ));
        response.put("monthlyApplications", monthly.entrySet().stream().map(e -> Map.of("month", e.getKey(), "count", e.getValue())).toList());
        response.put("subjectDistribution", subjectDistribution.entrySet().stream().map(e -> Map.of("key", e.getKey(), "count", e.getValue())).toList());
        response.put("locationDistribution", locationDistribution.entrySet().stream().map(e -> Map.of("location", e.getKey(), "count", e.getValue())).toList());
        response.put("examSeatStats", examSeatStats);
        response.put("rows", rows);
        response.put("students", profileMap.values().stream().map(p -> studentRow(p, filtered)).toList());
        response.put("exams", activeExams.stream()
                .sorted(Comparator.comparing(Exam::getExamDate))
                .map(e -> Map.of(
                        "id", e.getId(),
                        "name", e.getName(),
                        "year", e.getYear(),
                        "session", e.getSession().name().toLowerCase(),
                        "date", e.getExamDate(),
                        "location", e.getLocation()
                ))
                .toList());
        return response;
    }

    private Map<String, Object> studentRow(Profile profile, List<Application> applications) {
        long applied = applications.stream().filter(a -> profile.getId().equals(a.getUserId())).count();
        Map<String, Object> row = new HashMap<>();
        row.put("id", profile.getId());
        row.put("firstName", profile.getFirstName());
        row.put("lastName", profile.getLastName());
        row.put("email", profile.getEmail());
        row.put("passportNumber", profile.getPassportNumber());
        row.put("phone", profile.getPhone());
        row.put("address", profile.getAddress());
        row.put("isActive", profile.isActive());
        row.put("applications", applied);
        return row;
    }
}
