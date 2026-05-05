package com.eju.auth.subject;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subjects")
public class Subject {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(name = "name_mn", nullable = false)
    private String nameMn;

    @Column(name = "name_ja", nullable = false)
    private String nameJa;

    @Column(nullable = false)
    private String category;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getNameMn() { return nameMn; }
    public void setNameMn(String nameMn) { this.nameMn = nameMn; }
    public String getNameJa() { return nameJa; }
    public void setNameJa(String nameJa) { this.nameJa = nameJa; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
