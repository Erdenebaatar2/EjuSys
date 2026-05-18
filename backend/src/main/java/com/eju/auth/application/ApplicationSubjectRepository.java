package com.eju.auth.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface ApplicationSubjectRepository extends JpaRepository<ApplicationSubject, ApplicationSubjectId> {

    @Query("select a from ApplicationSubject a join fetch a.subject where a.id.applicationId = :appId")
    List<ApplicationSubject> findByApplicationId(@Param("appId") UUID applicationId);
}
