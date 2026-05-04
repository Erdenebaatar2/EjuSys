package com.eju.auth.application;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    long countByStatus(Application.Status status);

    List<Application> findTop5ByOrderByCreatedAtDesc();

    List<Application> findByUserId(UUID userId);

    @Query("""
        select a from Application a
        where (:status is null or a.status = :status)
          and (:examId is null or a.examId = :examId)
          and (:search is null or lower(a.applicationNumber) like lower(concat('%', :search, '%')))
        order by a.createdAt desc
    """)
    Page<Application> search(@Param("status") Application.Status status,
                             @Param("examId") UUID examId,
                             @Param("search") String search,
                             Pageable pageable);
}
