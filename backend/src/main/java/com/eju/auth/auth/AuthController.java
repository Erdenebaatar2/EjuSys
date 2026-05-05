package com.eju.auth.auth;

import com.eju.auth.auth.dto.AuthDtos.*;
import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
import com.eju.auth.user.Role;
import com.eju.auth.user.User;
import com.eju.auth.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.EnumSet;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final ProfileRepository profileRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(UserRepository userRepo,
                          ProfileRepository profileRepo,
                          PasswordEncoder encoder,
                          JwtService jwt) {
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepo.existsByEmailIgnoreCase(req.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("Email already registered"));
        }
        User u = new User();
        u.setEmail(req.email().toLowerCase());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setFirstName(req.firstName());
        u.setLastName(req.lastName());
        u.setRoles(EnumSet.of(Role.STUDENT));
        u = userRepo.save(u);

        Profile p = new Profile();
        p.setId(u.getId());
        p.setFirstName(req.firstName());
        p.setLastName(req.lastName());
        p.setEmail(req.email().toLowerCase());
        p.setPassportNumber(req.passportNumber() != null ? req.passportNumber() : "");
        p.setPhone(req.phone());
        profileRepo.save(p);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(jwt.issueToken(u), UserResponse.from(u)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        User u = userRepo.findByEmailIgnoreCase(req.email()).orElse(null);
        if (u == null || !encoder.matches(req.password(), u.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid email or password"));
        }
        return ResponseEntity.ok(new AuthResponse(jwt.issueToken(u), UserResponse.from(u)));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Object principal = auth.getPrincipal();
        if (!(principal instanceof UUID id)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return userRepo.findById(id)
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(UserResponse.from(u)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }
}
