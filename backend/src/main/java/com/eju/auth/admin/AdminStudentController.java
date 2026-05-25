package com.eju.auth.admin;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.exam.ExamRepository;
import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
import com.eju.auth.user.Role;
import com.eju.auth.user.User;
import com.eju.auth.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
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
    private final ExamRepository examRepo;

    public AdminStudentController(UserRepository userRepo,
                                  ProfileRepository profileRepo,
                                  ApplicationRepository appRepo,
                                  ExamRepository examRepo) {
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.appRepo = appRepo;
        this.examRepo = examRepo;
    }

    public record ActiveBody(boolean isActive) {}
    public record StudentUpdateBody(
            String firstName,
            String lastName,
            String email,
            String phone,
            String address,
            String passportNumber,
            Boolean isActive
    ) {}

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

    @GetMapping("/unregistered")
    public ResponseEntity<?> unregistered(
            @RequestParam UUID examId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (!examRepo.existsById(examId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Exam not found"));
        }
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String normalizedSearch = search == null ? "" : search.trim();
        Page<User> result = userRepo.searchStudentsNotRegisteredForExam(
                Role.STUDENT,
                Role.ADMIN,
                examId,
                normalizedSearch,
                pageable
        );
        List<Map<String, Object>> items = result.getContent().stream().map(this::toDto).toList();
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("items", items);
        resp.put("total", result.getTotalElements());
        resp.put("page", page);
        resp.put("size", size);
        return ResponseEntity.ok(resp);
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

    @PatchMapping("/{userId}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable UUID userId, @RequestBody StudentUpdateBody body) {
        return userRepo.findById(userId).<ResponseEntity<?>>map(u -> {
            if (!isEditableStudent(u)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Only student information can be edited here"));
            }
            Profile p = profileRepo.findById(userId).orElseGet(() -> profileFromUser(u));

            String firstName = valueOrCurrent(body.firstName(), p.getFirstName(), u.getFirstName());
            String lastName = valueOrCurrent(body.lastName(), p.getLastName(), u.getLastName());
            String email = valueOrCurrent(body.email(), p.getEmail(), u.getEmail());
            String phone = valueOrCurrent(body.phone(), p.getPhone(), null);
            String address = valueOrCurrent(body.address(), p.getAddress(), null);
            String passportNumber = valueOrCurrent(body.passportNumber(), p.getPassportNumber(), null);

            String validationError = requiredError(firstName, lastName, email, phone, address, passportNumber);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(Map.of("message", validationError));
            }

            var existingEmailOwner = userRepo.findByEmailIgnoreCase(email);
            if (existingEmailOwner.isPresent() && !existingEmailOwner.get().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Email already exists"));
            }

            u.setFirstName(firstName);
            u.setLastName(lastName);
            u.setEmail(email);
            p.setId(userId);
            p.setFirstName(firstName);
            p.setLastName(lastName);
            p.setEmail(email);
            p.setPhone(phone);
            p.setAddress(address);
            p.setPassportNumber(passportNumber);
            if (body.isActive() != null) {
                p.setActive(body.isActive());
            }

            userRepo.save(u);
            profileRepo.save(p);
            return ResponseEntity.ok(toDto(u));
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

    private boolean isEditableStudent(User u) {
        return u.getRoles() != null && u.getRoles().contains(Role.STUDENT) && !u.getRoles().contains(Role.ADMIN);
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

    private String valueOrCurrent(String requested, String profileValue, String userValue) {
        if (requested != null) return requested.trim();
        String current = firstNonBlank(profileValue, userValue);
        return current == null ? "" : current.trim();
    }

    private String requiredError(String firstName,
                                 String lastName,
                                 String email,
                                 String phone,
                                 String address,
                                 String passportNumber) {
        if (firstName.isBlank()) return "First name is required";
        if (lastName.isBlank()) return "Last name is required";
        if (email.isBlank()) return "Email is required";
        if (phone.isBlank()) return "Phone is required";
        if (address.isBlank()) return "Address is required";
        if (passportNumber.isBlank()) return "Document number is required";
        return null;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }
}
