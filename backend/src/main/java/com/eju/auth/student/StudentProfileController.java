package com.eju.auth.student;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
import com.eju.auth.user.User;
import com.eju.auth.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/profile")
public class StudentProfileController {

    private final ProfileRepository profileRepo;
    private final UserRepository userRepo;
    private final ApplicationRepository appRepo;

    public StudentProfileController(ProfileRepository profileRepo,
                                    UserRepository userRepo,
                                    ApplicationRepository appRepo) {
        this.profileRepo = profileRepo;
        this.userRepo = userRepo;
        this.appRepo = appRepo;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        User user = user(userId);
        Profile profile = profileRepo.findById(userId).orElseGet(() -> profileFromUser(user));
        applyApplicationFallback(profile, userId);
        return ResponseEntity.ok(toMap(profile));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        User user = user(userId);
        Profile profile = profileRepo.findById(userId).orElseGet(() -> profileFromUser(user));

        if (containsLockedPersonalField(body)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Personal information cannot be changed after registration. Please contact an admin.");
        }

        if (body.containsKey("profilePhotoPath")) profile.setProfilePhotoPath(blankToNull(body.get("profilePhotoPath")));

        userRepo.save(user);
        profileRepo.save(profile);
        return ResponseEntity.ok(toMap(profile));
    }

    private boolean containsLockedPersonalField(Map<String, String> body) {
        return body.containsKey("firstName")
                || body.containsKey("lastName")
                || body.containsKey("email")
                || body.containsKey("phone")
                || body.containsKey("address")
                || body.containsKey("passportNumber");
    }

    private User user(UUID userId) {
        return userRepo.findById(userId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Profile profileFromUser(User user) {
        Profile p = new Profile();
        p.setId(user.getId());
        p.setFirstName(user.getFirstName());
        p.setLastName(user.getLastName());
        p.setEmail(user.getEmail());
        p.setPassportNumber("");
        p.setActive(true);
        return p;
    }

    private void applyApplicationFallback(Profile profile, UUID userId) {
        Application app = appRepo.findFirstByUserIdOrderByCreatedAtDesc(userId).orElse(null);
        if (app == null) return;
        if (isBlank(profile.getPhone())) {
            profile.setPhone(firstNonBlank(app.getMobilePhone(), app.getTelephone(), app.getPhone()));
        }
        if (isBlank(profile.getAddress())) {
            profile.setAddress(app.getAddress());
        }
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
        m.put("profilePhotoPath", p.getProfilePhotoPath());
        return m;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String blankToNull(String value) {
        return isBlank(value) ? null : value;
    }

    private String blankToEmpty(String value) {
        return isBlank(value) ? "" : value;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) return value;
        }
        return null;
    }
}
