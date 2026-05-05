package com.eju.auth.student;

import com.eju.auth.subject.SubjectRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student/subjects")
public class StudentSubjectController {

    private final SubjectRepository subjectRepo;

    public StudentSubjectController(SubjectRepository subjectRepo) {
        this.subjectRepo = subjectRepo;
    }

    @GetMapping
    public List<Map<String, Object>> listSubjects() {
        return subjectRepo.findAllByOrderByCategory().stream()
                .map(s -> Map.<String, Object>of(
                        "id", s.getId(),
                        "code", s.getCode(),
                        "nameMn", s.getNameMn(),
                        "nameJa", s.getNameJa(),
                        "category", s.getCategory()
                ))
                .toList();
    }
}
