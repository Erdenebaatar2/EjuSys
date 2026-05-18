package com.eju.auth.student;

import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/profile")
public class StudentProfileController {

    private final ProfileRepository profileRepo;

    public StudentProfileController(ProfileRepository profileRepo) {
        this.profileRepo = profileRepo;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return profileRepo.findById(userId)
                .map(p -> ResponseEntity.ok(toMap(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return profileRepo.findById(userId)
                .map(p -> {
                    if (body.containsKey("firstName")) p.setFirstName(body.get("firstName"));
                    if (body.containsKey("lastName")) p.setLastName(body.get("lastName"));
                    if (body.containsKey("phone")) p.setPhone(body.get("phone"));
                    if (body.containsKey("address")) p.setAddress(body.get("address"));
                    profileRepo.save(p);
                    return ResponseEntity.ok(toMap(p));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toMap(Profile p) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", p.getId());
        m.put("firstName", p.getFirstName());
        m.put("lastName", p.getLastName());
        m.put("email", p.getEmail());
        m.put("passportNumber", p.getPassportNumber());
        m.put("phone", p.getPhone() != null ? p.getPhone() : "");
        m.put("address", p.getAddress() != null ? p.getAddress() : "");
        return m;
    }
}
