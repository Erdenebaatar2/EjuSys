package com.eju.auth.request;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SupportRequestRepository extends JpaRepository<SupportRequest, UUID> {
    List<SupportRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<SupportRequest> findAllByOrderByCreatedAtDesc();
}
