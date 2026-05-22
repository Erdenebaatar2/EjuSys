package com.eju.auth.application;

import com.eju.auth.exam.Exam;
import org.springframework.stereotype.Service;

@Service
public class ApplicationNumberService {

    private final ApplicationRepository appRepo;

    public ApplicationNumberService(ApplicationRepository appRepo) {
        this.appRepo = appRepo;
    }

    public String nextNumber(Exam exam, Application app) {
        String subjectCode = subjectCode(app);
        String prefix = regionCode(app.getCountryCode()) + "-" + examCode(exam) + "-" + subjectCode;
        int sequenceWidth = Math.max(3, 6 - subjectCode.length());
        long next = appRepo.countByApplicationNumberStartingWith(prefix) + 1;
        String candidate;
        do {
            candidate = prefix + String.format("%0" + sequenceWidth + "d", next);
            next++;
        } while (appRepo.existsByApplicationNumber(candidate));
        return candidate;
    }

    private String regionCode(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) return "XX";
        String normalized = countryCode.trim().toUpperCase();
        return normalized.length() >= 2 ? normalized.substring(0, 2) : normalized;
    }

    private String examCode(Exam exam) {
        int year = Math.floorMod(exam.getYear(), 100);
        int session = exam.getSession() == Exam.Session.SECOND ? 2 : 1;
        return String.format("%02d%02d", year, session);
    }

    private String subjectCode(Application app) {
        StringBuilder code = new StringBuilder();
        if (app.isSubjectJapanese()) code.append("1");
        if (app.isSubjectMathematics()) code.append("1");
        if (app.isSubjectScience()) code.append("2");
        if (app.isSubjectJapanAndWorld()) code.append("3");
        return code.isEmpty() ? "0" : code.toString();
    }
}
