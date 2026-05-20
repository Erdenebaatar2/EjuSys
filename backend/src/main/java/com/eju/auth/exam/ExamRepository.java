package com.eju.auth.exam;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamRepository extends JpaRepository<Exam, UUID> {

    List<Exam> findByActiveTrueAndRegistrationEndGreaterThanEqualOrderByExamDateAsc(LocalDate today);
    List<Exam> findByActiveTrueAndRegistrationStartLessThanEqualAndRegistrationEndGreaterThanEqualOrderByExamDateAsc(
            LocalDate registrationStart,
            LocalDate registrationEnd
    );
    Optional<Exam> findFirstByActiveTrue();
    boolean existsByActiveTrue();

    default Optional<Exam> findFirstRegistrationOpen(LocalDate today) {
        return findByActiveTrueAndRegistrationStartLessThanEqualAndRegistrationEndGreaterThanEqualOrderByExamDateAsc(
                today,
                today
        ).stream().findFirst();
    }
}
