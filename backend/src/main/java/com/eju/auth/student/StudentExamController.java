package com.eju.auth.student;

import java.time.LocalDate;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;

@RestController
@RequestMapping("/api/student/exams")
public class StudentExamController {

    private final ExamRepository examRepository;

    public StudentExamController(ExamRepository examRepository) {
        this.examRepository = examRepository;
    }

    @GetMapping
    public List<Exam> getOpenExams() {
        return examRepository
            .findByActiveTrueAndRegistrationEndGreaterThanEqualOrderByExamDateAsc(
                LocalDate.now()
            );
    }
}