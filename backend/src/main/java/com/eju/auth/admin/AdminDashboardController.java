package com.eju.auth.admin;

import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.exam.ExamRepository;
import com.eju.auth.profile.ProfileRepository;
import com.eju.auth.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final UserRepository userRepo;
    private final ApplicationRepository appRepo;
    private final ExamRepository examRepo;
    private final ProfileRepository profileRepo;

    public AdminDashboardController(UserRepository userRepo,
                                    ApplicationRepository appRepo,
                                    ExamRepository examRepo,
                                    ProfileRepository profileRepo) {
        this.userRepo = userRepo;
        this.appRepo = appRepo;
        this.examRepo = examRepo;
        this.profileRepo = profileRepo;
    }

    @GetMapping
    public Map<String, Object> stats() {
        long registeredStudents = appRepo.countDistinctUsersWithActiveExamApplications();
        long activeExams = examRepo.findByActiveTrueOrderByExamDateAsc().size();
        List<Map<String, Object>> recent = appRepo.findTop5ByActiveExamOrderByCreatedAtDesc(PageRequest.of(0, 5)).stream()
                .map(a -> {
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", a.getId());
                    m.put("applicationNumber", a.getApplicationNumber());
                    m.put("status", a.getStatus().name().toLowerCase());
                    m.put("paymentStatus", a.getPaymentStatus().name().toLowerCase());
                    m.put("createdAt", a.getCreatedAt());
                    profileRepo.findById(a.getUserId()).ifPresent(p -> {
                        m.put("studentName", p.getFirstName() + " " + p.getLastName());
                        m.put("studentEmail", p.getEmail());
                    });
                    return m;
                }).toList();
        return Map.of(
                "totalUsers", registeredStudents,
                "activeExams", activeExams,
                "totalUsersAll", userRepo.count(),
                "recentApplications", recent
        );
    }
}
