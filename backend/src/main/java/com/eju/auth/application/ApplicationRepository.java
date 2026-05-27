package com.eju.auth.application;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    long countByStatus(Application.Status status);

    @Query("select count(distinct a.userId) from Application a")
    long countDistinctUsersWithApplications();

    @Query("""
        select count(distinct a.userId) from Application a
        where exists (
          select 1 from Exam e
          where e.id = a.examId
            and e.active = true
        )
    """)
    long countDistinctUsersWithActiveExamApplications();

    @Query("""
        select a from Application a
        where exists (
          select 1 from Exam e
          where e.id = a.examId
            and e.active = true
        )
        order by a.createdAt desc
    """)
    List<Application> findTop5ByActiveExamOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
        select a from Application a
        where a.userId = :userId
          and exists (
            select 1 from Exam e
            where e.id = a.examId
              and e.active = true
          )
        order by a.createdAt desc
    """)
    List<Application> findActiveExamApplicationsByUserId(@Param("userId") UUID userId);

    List<Application> findTop5ByOrderByCreatedAtDesc();

    List<Application> findByUserId(UUID userId);

    List<Application> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Application> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Application> findByExamId(UUID examId);

    java.util.Optional<Application> findByUserIdAndExamId(UUID userId, UUID examId);

    long countByApplicationNumberStartingWith(String prefix);

    boolean existsByApplicationNumber(String applicationNumber);

    @Query("""
        select a from Application a
        where (:status is null or a.status = :status)
          and (:paymentStatus is null or a.paymentStatus = :paymentStatus)
          and (:examId is null or a.examId = :examId)
          and (
            :activeExamsOnly = false
            or exists (
              select 1 from Exam activeExam
              where activeExam.id = a.examId
                and activeExam.active = true
            )
          )
          and (:fromDate is null or a.createdAt >= :fromDate)
          and (:toDate is null or a.createdAt <= :toDate)
          and (
            :search is null
            or lower(a.applicationNumber) like lower(concat('%', :search, '%'))
            or (:searchUuid is not null and (a.id = :searchUuid or a.userId = :searchUuid or a.examId = :searchUuid))
            or exists (
              select 1 from Profile p
              where p.id = a.userId
                and (
                  lower(p.firstName) like lower(concat('%', :search, '%'))
                  or lower(p.lastName) like lower(concat('%', :search, '%'))
                  or lower(p.email) like lower(concat('%', :search, '%'))
                  or lower(p.passportNumber) like lower(concat('%', :search, '%'))
                )
            )
            or exists (
              select 1 from Exam e
              where e.id = a.examId
                and (
                  lower(e.name) like lower(concat('%', :search, '%'))
                  or lower(e.location) like lower(concat('%', :search, '%'))
                )
            )
          )
        order by a.createdAt desc
    """)
    Page<Application> search(@Param("status") Application.Status status,
                             @Param("paymentStatus") Application.PaymentStatus paymentStatus,
                             @Param("examId") UUID examId,
                             @Param("activeExamsOnly") boolean activeExamsOnly,
                             @Param("fromDate") Instant fromDate,
                             @Param("toDate") Instant toDate,
                             @Param("searchUuid") UUID searchUuid,
                             @Param("search") String search,
                             Pageable pageable);
}
