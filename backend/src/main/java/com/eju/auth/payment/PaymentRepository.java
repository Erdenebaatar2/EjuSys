package com.eju.auth.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findFirstByApplicationIdOrderByCreatedAtDesc(UUID applicationId);

    void deleteByApplicationId(UUID applicationId);
}
