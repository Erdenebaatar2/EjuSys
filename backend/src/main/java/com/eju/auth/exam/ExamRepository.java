package com.eju.auth.exam;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamRepository extends JpaRepository<Exam, UUID> {

    List<Exam> findByActiveTrueOrderByExamDateAsc();
    List<Exam> findByActiveTrueAndRegistrationEndGreaterThanEqualOrderByExamDateAsc(LocalDate today);
    Optional<Exam> findFirstByActiveTrueOrderByExamDateAsc();

    default Optional<Exam> findFirstRegistrationOpen(LocalDate today) {
        return findByActiveTrueAndRegistrationEndGreaterThanEqualOrderByExamDateAsc(today)
                .stream()
                .findFirst();
    }
}
