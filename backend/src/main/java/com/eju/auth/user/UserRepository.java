package com.eju.auth.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    @Query("""
        select u from User u
        where :studentRole member of u.roles
          and :adminRole not member of u.roles
          and (
            :search = ''
            or lower(u.firstName) like lower(concat('%', :search, '%'))
            or lower(u.lastName) like lower(concat('%', :search, '%'))
            or lower(u.email) like lower(concat('%', :search, '%'))
            or exists (
              select 1 from Profile p
              where p.id = u.id
                and (
                  lower(p.firstName) like lower(concat('%', :search, '%'))
                  or lower(p.lastName) like lower(concat('%', :search, '%'))
                  or lower(p.email) like lower(concat('%', :search, '%'))
                  or lower(p.passportNumber) like lower(concat('%', :search, '%'))
                )
            )
          )
    """)
    Page<User> searchStudents(@Param("studentRole") Role studentRole,
                              @Param("adminRole") Role adminRole,
                              @Param("search") String search,
                              Pageable pageable);
}
