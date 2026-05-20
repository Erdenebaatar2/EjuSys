package com.eju.auth.student;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.exam.ExamRepository;
import com.eju.auth.profile.ProfileRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/dashboard")
public class StudentDashboardController {

    private final ApplicationRepository appRepo;
    private final ExamRepository examRepo;
    private final ProfileRepository profileRepo;

    public StudentDashboardController(ApplicationRepository appRepo,
                                      ExamRepository examRepo,
                                      ProfileRepository profileRepo) {
        this.appRepo = appRepo;
        this.examRepo = examRepo;
        this.profileRepo = profileRepo;
    }

    @GetMapping
    public Map<String, Object> dashboard(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();

        LocalDate today = LocalDate.now();
        var activeExamOpt = examRepo.findFirstRegistrationOpen(today);

        List<Application> apps = appRepo.findByUserId(userId);
        long totalApps = apps.size();
        long pendingApps = apps.stream().filter(a -> a.getStatus() == Application.Status.PENDING).count();
        long approvedApps = apps.stream().filter(a -> a.getStatus() == Application.Status.APPROVED).count();
        var latestApp = appRepo.findFirstByUserIdOrderByCreatedAtDesc(userId).orElse(null);

        String firstName = profileRepo.findById(userId)
                .map(p -> p.getFirstName())
                .orElse("");

        var response = new java.util.LinkedHashMap<String, Object>();
        response.put("firstName", firstName);
        response.put("totalApps", totalApps);
        response.put("pendingApps", pendingApps);
        response.put("approvedApps", approvedApps);
        response.put("openExams", activeExamOpt.isPresent() ? 1 : 0);
        response.put("hasApplication", latestApp != null);
        response.put("applicationStatus", latestApp == null ? null : latestApp.getStatus().name().toLowerCase());
        response.put("applicationNumber", latestApp == null ? null : latestApp.getApplicationNumber());

        activeExamOpt.ifPresent(exam -> response.put("activeExam", Map.of(
                "id", exam.getId(),
                "name", exam.getName(),
                "year", exam.getYear(),
                "session", exam.getSession().name().toLowerCase(),
                "examDate", exam.getExamDate(),
                "registrationStart", exam.getRegistrationStart(),
                "registrationEnd", exam.getRegistrationEnd(),
                "location", exam.getLocation()
        )));
        return response;
    }
}
