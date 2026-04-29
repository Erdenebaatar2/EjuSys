package com.eju.auth.auth.dto;

import com.eju.auth.user.Role;
import com.eju.auth.user.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public class AuthDtos {

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6) String password,
            @NotBlank String firstName,
            @NotBlank String lastName
    ) {}

    public record UserResponse(
            UUID id,
            String email,
            String firstName,
            String lastName,
            List<Role> roles,
            Role role
    ) {
        public static UserResponse from(User u) {
            return new UserResponse(
                    u.getId(),
                    u.getEmail(),
                    u.getFirstName(),
                    u.getLastName(),
                    u.getRoles().stream().sorted().toList(),
                    u.highestRole()
            );
        }
    }

    public record AuthResponse(String token, UserResponse user) {}

    public record ErrorResponse(String message) {}
}
