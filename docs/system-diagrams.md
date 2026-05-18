# EJU System Diagrams

This document contains:
1. Use Case Diagram
2. Sequence Diagrams
3. Database (ER) Diagram

## 1) Use Case Diagram

```mermaid
flowchart LR
    Student([Student])
    Admin([Admin])
    System[(EJU Registration System)]

    UC1([Register / Login])
    UC2([View Active Exam])
    UC3([Fill EJU Application Form])
    UC4([Upload Photo])
    UC5([Submit Application])
    UC6([Edit Pending Application])
    UC7([View Application Status])

    UC8([Manage Active Exam])
    UC9([Search Applicants])
    UC10([Approve / Reject Application])
    UC11([Update Payment Status])
    UC12([View Dashboard KPI])
    UC13([View Reports & Charts])
    UC14([Export CSV Reports])

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
    Student --> UC7

    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14

    UC1 --- System
    UC2 --- System
    UC3 --- System
    UC4 --- System
    UC5 --- System
    UC6 --- System
    UC7 --- System
    UC8 --- System
    UC9 --- System
    UC10 --- System
    UC11 --- System
    UC12 --- System
    UC13 --- System
    UC14 --- System
```

## 2) Sequence Diagrams

### 2.1 Student Application Submission

```mermaid
sequenceDiagram
    actor Student
    participant FE as React Frontend
    participant BE as Spring Boot API
    participant DB as Supabase PostgreSQL
    participant FS as File Storage (uploads/)

    Student->>FE: Open /student/application
    FE->>BE: GET /api/student/exam (JWT)
    BE->>DB: Query active exam
    DB-->>BE: Exam row
    BE-->>FE: Exam data

    Student->>FE: Upload photo
    FE->>BE: POST /api/student/upload/photo (multipart)
    BE->>FS: Save file
    BE-->>FE: photo path

    Student->>FE: Submit form
    FE->>BE: POST /api/student/application (JSON + JWT)
    BE->>DB: Validate & insert application
    DB-->>BE: Insert success
    BE-->>FE: applicationNumber + status
    FE-->>Student: Show success toast/status
```

### 2.2 Admin Search + Approve/Reject

```mermaid
sequenceDiagram
    actor Admin
    participant FE as React Frontend
    participant BE as Spring Boot API
    participant DB as Supabase PostgreSQL

    Admin->>FE: Search by name/id/exam/passport
    FE->>BE: GET /api/admin/applications?search=...
    BE->>DB: Query applications + profile + exam filters
    DB-->>BE: Matching rows
    BE-->>FE: Paged result list

    Admin->>FE: Click Approve
    FE->>BE: PATCH /api/admin/applications/{id}/approve
    BE->>DB: Update status=APPROVED
    DB-->>BE: Updated
    BE-->>FE: Updated application

    Admin->>FE: Click Reject + reason
    FE->>BE: PATCH /api/admin/applications/{id}/reject
    BE->>DB: Update status=REJECTED, rejection_reason
    DB-->>BE: Updated
    BE-->>FE: Updated application
```

### 2.3 Admin Stats + CSV Export

```mermaid
sequenceDiagram
    actor Admin
    participant FE as React Frontend
    participant BE as Spring Boot API
    participant DB as Supabase PostgreSQL

    Admin->>FE: Open /admin/stats
    FE->>BE: GET /api/admin/stats?year=&session=&examId=
    BE->>DB: Aggregate KPI + charts + report rows
    DB-->>BE: Aggregated dataset
    BE-->>FE: stats payload
    FE-->>Admin: Render KPI + charts

    Admin->>FE: Click Export CSV
    FE->>FE: Build CSV from stats payload
    FE-->>Admin: Download .csv file
```

## 3) Database (ER) Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email
        string password
        string roles
        instant created_at
    }

    PROFILES {
        uuid id PK
        string first_name
        string last_name
        string email
        string passport_number
        string phone
        string address
        string profile_photo_path
        boolean is_active
        instant created_at
        instant updated_at
    }

    EXAMS {
        uuid id PK
        string name
        int year
        string session
        date exam_date
        string location
        int total_seats
        int available_seats
        date registration_start
        date registration_end
        string description
        boolean is_active
        instant created_at
        instant updated_at
    }

    APPLICATIONS {
        uuid id PK
        string application_number
        uuid user_id FK
        uuid exam_id FK
        string status
        string payment_status
        string name_alphabet
        string name_kanji
        string sex
        date date_of_birth
        string nationality
        string country_code
        string address
        string postal_code
        string address_code
        string telephone
        string mobile_phone
        string school_or_occupation
        boolean subject_japanese
        boolean subject_science
        boolean subject_japan_and_world
        boolean subject_mathematics
        string science_option_1
        string science_option_2
        string math_course
        string exam_language
        boolean jasso_scholarship_apply
        string exam_site
        string photo_url
        string passport_scan_path
        string rejection_reason
        instant created_at
        instant updated_at
    }

    SUBJECTS {
        uuid id PK
        string code
        string name_mn
        string name_ja
        string category
        instant created_at
    }

    APPLICATION_SUBJECTS {
        uuid application_id FK
        uuid subject_id FK
    }

    USERS ||--|| PROFILES : "has profile"
    PROFILES ||--o{ APPLICATIONS : "submits"
    EXAMS ||--o{ APPLICATIONS : "receives"
    APPLICATIONS ||--o{ APPLICATION_SUBJECTS : "maps"
    SUBJECTS ||--o{ APPLICATION_SUBJECTS : "maps"
```

