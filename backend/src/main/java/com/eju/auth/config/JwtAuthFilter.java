package com.eju.auth.config;

import com.eju.auth.auth.JwtService;
import com.eju.auth.user.User;
import com.eju.auth.user.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwt;
    private final UserRepository userRepo;

    public JwtAuthFilter(JwtService jwt, UserRepository userRepo) {
        this.jwt = jwt;
        this.userRepo = userRepo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            try {
                Claims claims = jwt.parse(token);
                UUID userId = jwt.userIdFrom(claims);
                User u = userRepo.findById(userId).orElse(null);
                if (u != null) {
                    List<SimpleGrantedAuthority> authorities = u.getRoles().stream()
                            .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name()))
                            .collect(Collectors.toList());
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ignored) {
                // invalid token → leave unauthenticated
            }
        }
        chain.doFilter(request, response);
    }
}
