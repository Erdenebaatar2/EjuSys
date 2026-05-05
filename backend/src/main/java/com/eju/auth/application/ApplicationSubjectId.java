package com.eju.auth.application;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class ApplicationSubjectId implements Serializable {

    @Column(name = "application_id", columnDefinition = "uuid")
    private UUID applicationId;

    @Column(name = "subject_id", columnDefinition = "uuid")
    private UUID subjectId;

    public ApplicationSubjectId() {}

    public ApplicationSubjectId(UUID applicationId, UUID subjectId) {
        this.applicationId = applicationId;
        this.subjectId = subjectId;
    }

    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID v) { this.applicationId = v; }
    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID v) { this.subjectId = v; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ApplicationSubjectId that)) return false;
        return Objects.equals(applicationId, that.applicationId) && Objects.equals(subjectId, that.subjectId);
    }

    @Override
    public int hashCode() { return Objects.hash(applicationId, subjectId); }
}
