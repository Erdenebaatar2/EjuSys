package com.eju.auth.config;

import com.eju.auth.subject.Subject;
import com.eju.auth.subject.SubjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
public class BootstrapSubjectsRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapSubjectsRunner.class);

    private final SubjectRepository subjectRepo;

    public BootstrapSubjectsRunner(SubjectRepository subjectRepo) {
        this.subjectRepo = subjectRepo;
    }

    @Override
    public void run(String... args) {
        if (subjectRepo.count() > 0) {
            log.info("BootstrapSubjects: subjects already exist, skipping.");
            return;
        }
        log.info("BootstrapSubjects: seeding EJU subjects...");

        seed("J1", "japanese", "Япон хэл (дээд түвшин)", "日本語（上級）");
        seed("J2", "japanese", "Япон хэл (суурь түвшин)", "日本語（基礎）");
        seed("K1", "math", "Математик курс 1", "数学コース1");
        seed("K2", "math", "Математик курс 2", "数学コース2");
        seed("PHY", "science", "Физик", "物理");
        seed("CHEM", "science", "Хими", "化学");
        seed("BIO", "science", "Биологи", "生物");
        seed("GEN", "general", "Ерөнхий хичээл", "総合科目");

        log.info("BootstrapSubjects: seeded {} subjects.", subjectRepo.count());
    }

    private void seed(String code, String category, String nameMn, String nameJa) {
        Subject s = new Subject();
        s.setCode(code);
        s.setCategory(category);
        s.setNameMn(nameMn);
        s.setNameJa(nameJa);
        subjectRepo.save(s);
    }
}
