package com.eju.auth.user;

import com.eju.auth.auth.dto.AuthDtos.ErrorResponse;
import com.eju.auth.auth.dto.AuthDtos.UserResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.EnumSet;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepo;

    public AdminController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return userRepo.findAll().stream().map(UserResponse::from).toList();
    }

    @PostMapping("/users/{id}/promote")
    public ResponseEntity<?> promote(@PathVariable UUID id) {
        return userRepo.findById(Objects.requireNonNull(id)).<ResponseEntity<?>>map(u -> {
            EnumSet<Role> roles = EnumSet.copyOf(u.getRoles());
            roles.add(Role.ADMIN);
            u.setRoles(roles);
            userRepo.save(u);
            return ResponseEntity.ok(UserResponse.from(u));
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("User not found")));
    }

    @PostMapping("/users/{id}/demote")
    public ResponseEntity<?> demote(@PathVariable UUID id) {
        return userRepo.findById(Objects.requireNonNull(id)).<ResponseEntity<?>>map(u -> {
            EnumSet<Role> roles = EnumSet.copyOf(u.getRoles());
            roles.remove(Role.ADMIN);
            if (roles.isEmpty()) roles.add(Role.STUDENT);
            u.setRoles(roles);
            userRepo.save(u);
            return ResponseEntity.ok(UserResponse.from(u));
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("User not found")));
    }
}