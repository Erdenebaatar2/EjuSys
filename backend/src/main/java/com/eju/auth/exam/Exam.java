package com.eju.auth.exam;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "exams")
public class Exam {

    public enum Session { FIRST, SECOND }

    public enum ExamHost {
        ULAANBAATAR("Улаанбаатар"),
        DARKHAN("Дархан"),
        ERDENET("Эрдэнэт");

        private final String displayName;

        ExamHost(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Session session;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_host")
    private ExamHost examHost = ExamHost.ULAANBAATAR;

    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @Column(nullable = false)
    private String location;

    @Column(name = "total_seats", nullable = false)
    private Integer totalSeats;

    @Column(name = "available_seats", nullable = false)
    private Integer availableSeats;

    @Column(name = "exam_fee")
    private Integer examFee = 70000;

    @Column(name = "registration_start", nullable = false)
    private LocalDate registrationStart;

    @Column(name = "registration_end", nullable = false)
    private LocalDate registrationEnd;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "exam_info_location")
    private String examInfoLocation;

    @Column(name = "exam_info_start_time")
    private LocalTime examInfoStartTime;

    @Column(name = "exam_info_method", columnDefinition = "text")
    private String examInfoMethod;

    @Column(name = "exam_info_duration_minutes")
    private Integer examInfoDurationMinutes;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
        if (totalSeats == null) totalSeats = 0;
        if (availableSeats == null) availableSeats = totalSeats;
        if (examFee == null) examFee = 70000;
        normalizeHostFields();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
        normalizeHostFields();
    }

    private void normalizeHostFields() {
        if (examHost == null) examHost = ExamHost.ULAANBAATAR;
        if (location == null || location.isBlank()) {
            location = examHost.getDisplayName();
        }
        if ((name == null || name.isBlank()) && year != null && session != null) {
            name = "EJU " + year + " " + sessionLabel(session) + " - " + examHost.getDisplayName();
        }
    }

    private String sessionLabel(Session session) {
        return session == Session.FIRST ? "1-р шалгалт" : "2-р шалгалт";
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Session getSession() { return session; }
    public void setSession(Session session) { this.session = session; }
    public ExamHost getExamHost() { return examHost; }
    public void setExamHost(ExamHost examHost) { this.examHost = examHost; }
    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Integer getTotalSeats() { return totalSeats; }
    public void setTotalSeats(Integer totalSeats) { this.totalSeats = totalSeats; }
    public Integer getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(Integer availableSeats) { this.availableSeats = availableSeats; }
    public Integer getExamFee() { return examFee; }
    public void setExamFee(Integer examFee) { this.examFee = examFee; }
    public LocalDate getRegistrationStart() { return registrationStart; }
    public void setRegistrationStart(LocalDate v) { this.registrationStart = v; }
    public LocalDate getRegistrationEnd() { return registrationEnd; }
    public void setRegistrationEnd(LocalDate v) { this.registrationEnd = v; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getExamInfoLocation() { return examInfoLocation; }
    public void setExamInfoLocation(String examInfoLocation) { this.examInfoLocation = examInfoLocation; }
    public LocalTime getExamInfoStartTime() { return examInfoStartTime; }
    public void setExamInfoStartTime(LocalTime examInfoStartTime) { this.examInfoStartTime = examInfoStartTime; }
    public String getExamInfoMethod() { return examInfoMethod; }
    public void setExamInfoMethod(String examInfoMethod) { this.examInfoMethod = examInfoMethod; }
    public Integer getExamInfoDurationMinutes() { return examInfoDurationMinutes; }
    public void setExamInfoDurationMinutes(Integer examInfoDurationMinutes) { this.examInfoDurationMinutes = examInfoDurationMinutes; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
