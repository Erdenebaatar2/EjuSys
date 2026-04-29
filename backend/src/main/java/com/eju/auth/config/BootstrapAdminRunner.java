package com.eju.auth.config;

import com.eju.auth.user.Role;
import com.eju.auth.user.User;
import com.eju.auth.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.EnumSet;

@Component
public class BootstrapAdminRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapAdminRunner.class);

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final String email;
    private final String password;
    private final String firstName;
    private final String lastName;

    public BootstrapAdminRunner(UserRepository userRepo,
                                PasswordEncoder encoder,
                                @Value("${app.bootstrap-admin.email:}") String email,
                                @Value("${app.bootstrap-admin.password:}") String password,
                                @Value("${app.bootstrap-admin.first-name:Admin}") String firstName,
                                @Value("${app.bootstrap-admin.last-name:User}") String lastName) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    @Override
    public void run(String... args) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            log.info("BootstrapAdmin: ADMIN_EMAIL/ADMIN_PASSWORD not set, skipping.");
            return;
        }
        userRepo.findByEmailIgnoreCase(email).ifPresentOrElse(
                u -> {
                    if (!u.getRoles().contains(Role.ADMIN)) {
                        EnumSet<Role> roles = EnumSet.copyOf(u.getRoles());
                        roles.add(Role.ADMIN);
                        u.setRoles(roles);
                        userRepo.save(u);
                        log.info("BootstrapAdmin: promoted existing user {} to ADMIN", email);
                    } else {
                        log.info("BootstrapAdmin: user {} already ADMIN", email);
                    }
                },
                () -> {
                    User u = new User();
                    u.setEmail(email.toLowerCase());
                    u.setPasswordHash(encoder.encode(password));
                    u.setFirstName(firstName);
                    u.setLastName(lastName);
                    u.setRoles(EnumSet.of(Role.STUDENT, Role.ADMIN));
                    userRepo.save(u);
                    log.info("BootstrapAdmin: created admin user {}", email);
                }
        );
    }
}
