package com.eju.auth.application;

import com.eju.auth.subject.Subject;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "application_subjects")
public class ApplicationSubject {

    @EmbeddedId
    private ApplicationSubjectId id;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("subjectId")
    @JoinColumn(name = "subject_id")
    private Subject subject;

    public ApplicationSubject() {}

    public ApplicationSubject(UUID applicationId, UUID subjectId) {
        this.id = new ApplicationSubjectId(applicationId, subjectId);
    }

    public ApplicationSubjectId getId() { return id; }
    public Subject getSubject() { return subject; }
}
