package com.eju.auth.application;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "applications")
public class Application {

    public enum Status { PENDING, APPROVED, REJECTED }
    public enum PaymentStatus { UNPAID, PAID }
    public enum Sex { MALE, FEMALE }
    public enum ScienceOption { PHYSICS, CHEMISTRY, BIOLOGY }
    public enum MathCourse { COURSE1, COURSE2 }
    public enum ExamLanguage { JAPANESE, ENGLISH }
    public enum ExamSite { JAKARTA, SURABAYA, HANOI, HOCHIMINH, BANGKOK, CHIANGMAI }

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "application_number", nullable = false, unique = true)
    private String applicationNumber;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "exam_id", nullable = false, columnDefinition = "uuid")
    private UUID examId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    private String phone;
    private String address;

    @Column(name = "target_university")
    private String targetUniversity;

    @Column(name = "passport_scan_path")
    private String passportScanPath;

    @Column(name = "photo_path")
    private String photoPath;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "name_alphabet")
    private String nameAlphabet;

    @Column(name = "name_kanji")
    private String nameKanji;

    @Enumerated(EnumType.STRING)
    private Sex sex;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    private String nationality;

    @Column(name = "country_code")
    private String countryCode;

    @Column(name = "postal_code")
    private String postalCode;

    @Column(name = "address_code")
    private String addressCode;

    private String telephone;

    @Column(name = "mobile_phone")
    private String mobilePhone;

    @Column(name = "school_or_occupation")
    private String schoolOrOccupation;

    @Column(name = "subject_japanese", nullable = false)
    private boolean subjectJapanese;

    @Column(name = "subject_science", nullable = false)
    private boolean subjectScience;

    @Column(name = "subject_japan_and_world", nullable = false)
    private boolean subjectJapanAndWorld;

    @Column(name = "subject_mathematics", nullable = false)
    private boolean subjectMathematics;

    @Enumerated(EnumType.STRING)
    @Column(name = "science_option_1")
    private ScienceOption scienceOption1;

    @Enumerated(EnumType.STRING)
    @Column(name = "science_option_2")
    private ScienceOption scienceOption2;

    @Enumerated(EnumType.STRING)
    @Column(name = "math_course")
    private MathCourse mathCourse;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_language")
    private ExamLanguage examLanguage;

    @Column(name = "jasso_scholarship_apply", nullable = false)
    private boolean jassoScholarshipApply;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_site")
    private ExamSite examSite;

    @Column(name = "rejection_reason", columnDefinition = "text")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
        if (applicationNumber == null || applicationNumber.isBlank()) {
            applicationNumber = "EJU-" + java.time.Year.now().getValue() + "-" +
                    UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }
    }
    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getApplicationNumber() { return applicationNumber; }
    public void setApplicationNumber(String v) { this.applicationNumber = v; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getExamId() { return examId; }
    public void setExamId(UUID examId) { this.examId = examId; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus v) { this.paymentStatus = v; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getTargetUniversity() { return targetUniversity; }
    public void setTargetUniversity(String v) { this.targetUniversity = v; }
    public String getPassportScanPath() { return passportScanPath; }
    public void setPassportScanPath(String v) { this.passportScanPath = v; }
    public String getPhotoPath() { return photoPath; }
    public void setPhotoPath(String v) { this.photoPath = v; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public String getNameAlphabet() { return nameAlphabet; }
    public void setNameAlphabet(String nameAlphabet) { this.nameAlphabet = nameAlphabet; }
    public String getNameKanji() { return nameKanji; }
    public void setNameKanji(String nameKanji) { this.nameKanji = nameKanji; }
    public Sex getSex() { return sex; }
    public void setSex(Sex sex) { this.sex = sex; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public String getAddressCode() { return addressCode; }
    public void setAddressCode(String addressCode) { this.addressCode = addressCode; }
    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }
    public String getMobilePhone() { return mobilePhone; }
    public void setMobilePhone(String mobilePhone) { this.mobilePhone = mobilePhone; }
    public String getSchoolOrOccupation() { return schoolOrOccupation; }
    public void setSchoolOrOccupation(String schoolOrOccupation) { this.schoolOrOccupation = schoolOrOccupation; }
    public boolean isSubjectJapanese() { return subjectJapanese; }
    public void setSubjectJapanese(boolean subjectJapanese) { this.subjectJapanese = subjectJapanese; }
    public boolean isSubjectScience() { return subjectScience; }
    public void setSubjectScience(boolean subjectScience) { this.subjectScience = subjectScience; }
    public boolean isSubjectJapanAndWorld() { return subjectJapanAndWorld; }
    public void setSubjectJapanAndWorld(boolean subjectJapanAndWorld) { this.subjectJapanAndWorld = subjectJapanAndWorld; }
    public boolean isSubjectMathematics() { return subjectMathematics; }
    public void setSubjectMathematics(boolean subjectMathematics) { this.subjectMathematics = subjectMathematics; }
    public ScienceOption getScienceOption1() { return scienceOption1; }
    public void setScienceOption1(ScienceOption scienceOption1) { this.scienceOption1 = scienceOption1; }
    public ScienceOption getScienceOption2() { return scienceOption2; }
    public void setScienceOption2(ScienceOption scienceOption2) { this.scienceOption2 = scienceOption2; }
    public MathCourse getMathCourse() { return mathCourse; }
    public void setMathCourse(MathCourse mathCourse) { this.mathCourse = mathCourse; }
    public ExamLanguage getExamLanguage() { return examLanguage; }
    public void setExamLanguage(ExamLanguage examLanguage) { this.examLanguage = examLanguage; }
    public boolean isJassoScholarshipApply() { return jassoScholarshipApply; }
    public void setJassoScholarshipApply(boolean jassoScholarshipApply) { this.jassoScholarshipApply = jassoScholarshipApply; }
    public ExamSite getExamSite() { return examSite; }
    public void setExamSite(ExamSite examSite) { this.examSite = examSite; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String v) { this.rejectionReason = v; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
