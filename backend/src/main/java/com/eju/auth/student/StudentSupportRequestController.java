package com.eju.auth.student;

import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
import com.eju.auth.request.SupportRequest;
import com.eju.auth.request.SupportRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/requests")
public class StudentSupportRequestController {

    private final SupportRequestRepository requestRepo;
    private final ProfileRepository profileRepo;

    public StudentSupportRequestController(SupportRequestRepository requestRepo,
                                           ProfileRepository profileRepo) {
        this.requestRepo = requestRepo;
        this.profileRepo = profileRepo;
    }

    @GetMapping
    public List<Map<String, Object>> list(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return requestRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toMap)
                .toList();
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody SupportRequestBody body,
                                                      Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        String subject = normalize(body.subject());
        String message = normalize(body.message());
        if (subject == null || message == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject and message are required");
        }
        if (subject.length() > 160) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject is too long");
        }

        SupportRequest request = new SupportRequest();
        request.setUserId(userId);
        request.setSubject(subject);
        request.setMessage(message);
        SupportRequest saved = requestRepo.save(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toMap(saved));
    }

    public record SupportRequestBody(String subject, String message) {}

    private Map<String, Object> toMap(SupportRequest request) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", request.getId());
        map.put("subject", request.getSubject());
        map.put("message", request.getMessage());
        map.put("read", request.getReadAt() != null);
        map.put("readAt", request.getReadAt());
        map.put("createdAt", request.getCreatedAt());
        Profile profile = profileRepo.findById(request.getUserId()).orElse(null);
        if (profile != null) {
            map.put("studentName", (profile.getLastName() + " " + profile.getFirstName()).trim());
        }
        return map;
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
