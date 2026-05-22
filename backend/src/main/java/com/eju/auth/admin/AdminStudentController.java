package com.eju.auth.admin;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
import com.eju.auth.user.Role;
import com.eju.auth.user.User;
import com.eju.auth.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/students")
public class AdminStudentController {

    private final UserRepository userRepo;
    private final ProfileRepository profileRepo;
    private final ApplicationRepository appRepo;

    public AdminStudentController(UserRepository userRepo,
                                  ProfileRepository profileRepo,
                                  ApplicationRepository appRepo) {
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.appRepo = appRepo;
    }

    public record ActiveBody(boolean isActive) {}

    @GetMapping
    public Map<String, Object> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String normalizedSearch = search == null ? "" : search.trim();
        Page<User> result = userRepo.searchStudents(Role.STUDENT, Role.ADMIN, normalizedSearch, pageable);
        List<Map<String, Object>> items = result.getContent().stream().map(this::toDto).toList();
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("items", items);
        resp.put("total", result.getTotalElements());
        resp.put("page", page);
        resp.put("size", size);
        return resp;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable UUID userId) {
        return userRepo.findById(userId).map(u -> {
            Map<String, Object> m = toDto(u);
            List<Application> apps = appRepo.findByUserId(userId);
            m.put("applications", apps.stream().map(a -> Map.of(
                    "id", a.getId(),
                    "applicationNumber", a.getApplicationNumber(),
                    "status", a.getStatus().name().toLowerCase(),
                    "paymentStatus", a.getPaymentStatus().name().toLowerCase(),
                    "createdAt", a.getCreatedAt()
            )).toList());
            return ResponseEntity.ok(m);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{userId}/active")
    public ResponseEntity<?> setActive(@PathVariable UUID userId, @RequestBody ActiveBody body) {
        return userRepo.findById(userId).<ResponseEntity<?>>map(u -> {
            Profile p = profileRepo.findById(userId).orElseGet(() -> profileFromUser(u));
            p.setActive(body.isActive());
            profileRepo.save(p);
            return ResponseEntity.ok(toDto(u));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    private Map<String, Object> toDto(User u) {
        Profile p = profileRepo.findById(u.getId()).orElse(null);
        Application latestApp = appRepo.findFirstByUserIdOrderByCreatedAtDesc(u.getId()).orElse(null);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("firstName", p != null ? p.getFirstName() : u.getFirstName());
        m.put("lastName", p != null ? p.getLastName() : u.getLastName());
        m.put("email", p != null ? p.getEmail() : u.getEmail());
        m.put("phone", firstNonBlank(p == null ? null : p.getPhone(),
                latestApp == null ? null : latestApp.getMobilePhone(),
                latestApp == null ? null : latestApp.getTelephone(),
                latestApp == null ? null : latestApp.getPhone()));
        m.put("passportNumber", p != null ? p.getPassportNumber() : "");
        m.put("address", firstNonBlank(p == null ? null : p.getAddress(),
                latestApp == null ? null : latestApp.getAddress()));
        m.put("isActive", p == null || p.isActive());
        m.put("createdAt", u.getCreatedAt());
        return m;
    }

    private Profile profileFromUser(User u) {
        Profile p = new Profile();
        p.setId(u.getId());
        p.setFirstName(u.getFirstName());
        p.setLastName(u.getLastName());
        p.setEmail(u.getEmail());
        p.setPassportNumber("");
        p.setActive(true);
        return p;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }
}
