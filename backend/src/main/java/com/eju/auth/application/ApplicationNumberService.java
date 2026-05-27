package com.eju.auth.application;

import com.eju.auth.exam.Exam;
import org.springframework.stereotype.Service;

@Service
public class ApplicationNumberService {

    private final ApplicationRepository appRepo;

    public ApplicationNumberService(ApplicationRepository appRepo) {
        this.appRepo = appRepo;
    }

    public synchronized String nextNumber(Exam exam, Application app) {
        String prefix = regionCode() + examCode(exam);
        int sequenceWidth = 3;
        long next = appRepo.countByApplicationNumberStartingWith(prefix) + 1;
        String candidate;
        do {
            candidate = prefix + String.format("%0" + sequenceWidth + "d", next);
            next++;
        } while (appRepo.existsByApplicationNumber(candidate));
        return candidate;
    }

    private String regionCode() {
        return "AS10";
    }

    private String examCode(Exam exam) {
        int sourceYear = exam.getYear() != null
                ? exam.getYear()
                : exam.getExamDate() == null
                ? java.time.Year.now().getValue()
                : exam.getExamDate().getYear();
        int year = Math.floorMod(sourceYear, 10);
        int round = exam.getExamRound() == null || exam.getExamRound() < 1 ? 1 : exam.getExamRound();
        return String.valueOf(year) + round;
    }
}
