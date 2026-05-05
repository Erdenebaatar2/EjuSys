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

        List<Application> apps = appRepo.findByUserId(userId);
        long totalApps = apps.size();
        long pendingApps = apps.stream().filter(a -> a.getStatus() == Application.Status.PENDING).count();
        long approvedApps = apps.stream().filter(a -> a.getStatus() == Application.Status.APPROVED).count();

        LocalDate today = LocalDate.now();
        long openExams = examRepo.findAll().stream()
                .filter(e -> e.isActive() && !e.getRegistrationEnd().isBefore(today))
                .count();

        String firstName = profileRepo.findById(userId)
                .map(p -> p.getFirstName())
                .orElse("");

        return Map.of(
                "firstName", firstName,
                "totalApps", totalApps,
                "pendingApps", pendingApps,
                "approvedApps", approvedApps,
                "openExams", openExams
        );
    }
}
