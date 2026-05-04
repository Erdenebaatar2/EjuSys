package com.eju.auth.admin;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
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

    private final ProfileRepository profileRepo;
    private final ApplicationRepository appRepo;

    public AdminStudentController(ProfileRepository profileRepo, ApplicationRepository appRepo) {
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
        Page<Profile> result;
        if (search == null || search.isBlank()) {
            result = profileRepo.findAll(pageable);
        } else {
            result = profileRepo
                    .findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPassportNumberContainingIgnoreCase(
                            search, search, search, search, pageable);
        }
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
        return profileRepo.findById(userId).map(p -> {
            Map<String, Object> m = toDto(p);
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
        return profileRepo.findById(userId).<ResponseEntity<?>>map(p -> {
            p.setActive(body.isActive());
            profileRepo.save(p);
            return ResponseEntity.ok(toDto(p));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    private Map<String, Object> toDto(Profile p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("firstName", p.getFirstName());
        m.put("lastName", p.getLastName());
        m.put("email", p.getEmail());
        m.put("phone", p.getPhone());
        m.put("passportNumber", p.getPassportNumber());
        m.put("address", p.getAddress());
        m.put("isActive", p.isActive());
        m.put("createdAt", p.getCreatedAt());
        return m;
    }
}
