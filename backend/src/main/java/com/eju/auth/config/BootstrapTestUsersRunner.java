package com.eju.auth.config;

import com.eju.auth.application.Application;
import com.eju.auth.application.ApplicationNumberService;
import com.eju.auth.application.ApplicationRepository;
import com.eju.auth.exam.Exam;
import com.eju.auth.exam.ExamRepository;
import com.eju.auth.profile.Profile;
import com.eju.auth.profile.ProfileRepository;
import com.eju.auth.user.Role;
import com.eju.auth.user.User;
import com.eju.auth.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

@Component
@Order(3)
public class BootstrapTestUsersRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapTestUsersRunner.class);
    private static final String EMAIL_DOMAIN = "example.com";

    private final UserRepository userRepo;
    private final ProfileRepository profileRepo;
    private final ExamRepository examRepo;
    private final ApplicationRepository appRepo;
    private final ApplicationNumberService applicationNumberService;
    private final PasswordEncoder encoder;
    private final boolean enabled;
    private final int count;
    private final String password;

    public BootstrapTestUsersRunner(UserRepository userRepo,
                                     ProfileRepository profileRepo,
                                     ExamRepository examRepo,
                                     ApplicationRepository appRepo,
                                     ApplicationNumberService applicationNumberService,
                                     PasswordEncoder encoder,
                                    @Value("${app.bootstrap-test-users.enabled:false}") boolean enabled,
                                    @Value("${app.bootstrap-test-users.count:60}") int count,
                                    @Value("${app.bootstrap-test-users.password:Test1234!}") String password) {
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.examRepo = examRepo;
        this.appRepo = appRepo;
        this.applicationNumberService = applicationNumberService;
        this.encoder = encoder;
        this.enabled = enabled;
        this.count = count;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (!enabled) {
            log.info("BootstrapTestUsers: disabled, skipping.");
            return;
        }

        List<Exam> exams = examRepo.findByActiveTrueOrderByExamDateAsc()
                .stream()
                .sorted(Comparator.comparing(Exam::getExamDate).thenComparing(Exam::getName))
                .toList();
        if (exams.isEmpty()) {
            log.warn("BootstrapTestUsers: no active exams found, skipping test applications.");
            return;
        }

        int createdUsers = 0;
        int createdApplications = 0;
        int ensuredApplications = 0;
        for (int i = 1; i <= count; i++) {
            String testName = "test" + i;
            String email = testName + "@" + EMAIL_DOMAIN;

            Optional<User> existingUser = userRepo.findByEmailIgnoreCase(email);
            User user = existingUser.orElseGet(() -> {
                User u = new User();
                u.setEmail(email);
                u.setPasswordHash(encoder.encode(password));
                u.setFirstName(testName);
                u.setLastName("user");
                u.setRoles(EnumSet.of(Role.STUDENT));
                return userRepo.save(u);
            });
            if (existingUser.isEmpty()) {
                createdUsers++;
            }

            upsertProfile(user, testName, email, i);

            List<Application> existingApps = appRepo.findActiveExamApplicationsByUserId(user.getId());
            if (!existingApps.isEmpty()) {
                existingApps.stream()
                        .filter(app -> isLegacyTestNumber(app.getApplicationNumber()))
                        .forEach(app -> {
                            Exam exam = examRepo.findById(app.getExamId()).orElse(null);
                            if (exam != null) {
                                app.setApplicationNumber(applicationNumberService.nextNumber(exam, app));
                                appRepo.save(app);
                            }
                        });
                ensuredApplications++;
                continue;
            }

            Exam exam = exams.get((i - 1) % exams.size());
            Application app = new Application();
            app.setUserId(user.getId());
            app.setExamId(exam.getId());
            app.setStatus(Application.Status.APPROVED);
            app.setPaymentStatus(Application.PaymentStatus.PAID);
            app.setPhone("99" + String.format("%06d", i));
            app.setMobilePhone("99" + String.format("%06d", i));
            app.setAddress("Ulaanbaatar, Test district " + ((i % 9) + 1));
            app.setTargetUniversity(sampleUniversity(i));
            app.setNameAlphabet(("TEST USER " + i).toUpperCase());
            app.setNameKanji(testName);
            app.setSex(i % 2 == 0 ? Application.Sex.FEMALE : Application.Sex.MALE);
            app.setDateOfBirth(LocalDate.of(2000 + (i % 8), ((i - 1) % 12) + 1, ((i - 1) % 27) + 1));
            app.setNationality("Mongolian");
            app.setCountryCode("MNG");
            app.setPostalCode("1" + String.format("%04d", i));
            app.setAddressCode("MN-" + String.format("%03d", i));
            app.setTelephone("11" + String.format("%06d", i));
            app.setSchoolOrOccupation("Test School " + ((i % 6) + 1));
            app.setSubjectJapanese(true);
            app.setSubjectScience(i % 3 != 0);
            app.setSubjectJapanAndWorld(i % 3 == 0);
            app.setSubjectMathematics(true);
            app.setScienceOption1(Application.ScienceOption.values()[i % Application.ScienceOption.values().length]);
            app.setScienceOption2(Application.ScienceOption.values()[(i + 1) % Application.ScienceOption.values().length]);
            app.setMathCourse(i % 2 == 0 ? Application.MathCourse.COURSE1 : Application.MathCourse.COURSE2);
            app.setExamLanguage(i % 4 == 0 ? Application.ExamLanguage.ENGLISH : Application.ExamLanguage.JAPANESE);
            app.setJassoScholarshipApply(i % 5 == 0);
            app.setExamSite(Application.ExamSite.values()[i % Application.ExamSite.values().length]);
            app.setApplicationNumber(applicationNumberService.nextNumber(exam, app));
            appRepo.save(app);
            createdApplications++;
            ensuredApplications++;
        }

        log.info("BootstrapTestUsers: ensured {} test users and {} active exam applications; created {} users and {} applications.",
                count, ensuredApplications, createdUsers, createdApplications);
    }

    private boolean isLegacyTestNumber(String applicationNumber) {
        return applicationNumber != null && applicationNumber.matches("EJU-\\d{4}-TEST\\d{3}");
    }

    private void upsertProfile(User user, String testName, String email, int index) {
        Profile profile = profileRepo.findById(user.getId()).orElseGet(() -> {
            Profile p = new Profile();
            p.setId(user.getId());
            return p;
        });
        profile.setFirstName(testName);
        profile.setLastName("user");
        profile.setEmail(email);
        profile.setPassportNumber("TEST" + String.format("%06d", index));
        profile.setPhone("99" + String.format("%06d", index));
        profile.setAddress("Ulaanbaatar, Test district " + ((index % 9) + 1));
        profile.setActive(true);
        profileRepo.save(profile);
    }

    private String sampleUniversity(int index) {
        String[] universities = {
                "Tokyo University",
                "Osaka University",
                "Kyoto University",
                "Waseda University",
                "Nagoya University"
        };
        return universities[(index - 1) % universities.length];
    }
}
