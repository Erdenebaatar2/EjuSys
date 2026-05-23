package com.eju.auth.admin;

import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
import com.eju.auth.request.SupportRequest;
import com.eju.auth.request.SupportRequestRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/requests")
public class AdminSupportRequestController {

    private final SupportRequestRepository requestRepo;
    private final ProfileRepository profileRepo;

    public AdminSupportRequestController(SupportRequestRepository requestRepo,
                                         ProfileRepository profileRepo) {
        this.requestRepo = requestRepo;
        this.profileRepo = profileRepo;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return requestRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toMap)
                .toList();
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable UUID id) {
        return requestRepo.findById(id)
                .map(request -> {
                    if (request.getReadAt() == null) {
                        request.setReadAt(Instant.now());
                        requestRepo.save(request);
                    }
                    return ResponseEntity.ok(toMap(request));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private Map<String, Object> toMap(SupportRequest request) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", request.getId());
        map.put("userId", request.getUserId());
        map.put("subject", request.getSubject());
        map.put("message", request.getMessage());
        map.put("read", request.getReadAt() != null);
        map.put("readAt", request.getReadAt());
        map.put("createdAt", request.getCreatedAt());

        Profile profile = profileRepo.findById(request.getUserId()).orElse(null);
        if (profile != null) {
            Map<String, Object> student = new HashMap<>();
            student.put("firstName", profile.getFirstName());
            student.put("lastName", profile.getLastName());
            student.put("email", profile.getEmail());
            student.put("phone", profile.getPhone());
            map.put("student", student);
        }
        return map;
    }
}
