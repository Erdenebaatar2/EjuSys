package com.eju.auth.exam;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamRepository extends JpaRepository<Exam, UUID> {

    List<Exam> findByActiveTrueAndRegistrationEndGreaterThanEqualOrderByExamDateAsc(LocalDate today);
}