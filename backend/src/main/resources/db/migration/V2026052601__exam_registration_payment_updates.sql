alter table if exists exams
  add column if not exists exam_round integer;

update exams
set exam_round = case upper(coalesce(session, 'FIRST'))
  when 'SECOND' then 2
  when 'THIRD' then 3
  else 1
end
where exam_round is null or exam_round < 1;

alter table if exists exams
  alter column exam_round set default 1;

alter table if exists exams
  add column if not exists is_active boolean default true;

update exams
set is_active = true
where is_active is null;

alter table if exists applications
  add column if not exists exam_language varchar(255);

alter table if exists applications
  add column if not exists jasso_scholarship_apply boolean default false;

alter table if exists applications
  add column if not exists special_exam boolean default false;

alter table if exists applications
  add column if not exists special_support_note text;

alter table if exists applications
  add column if not exists application_number varchar(255);

update applications
set jasso_scholarship_apply = false
where jasso_scholarship_apply is null;

update applications
set special_exam = false
where special_exam is null;

create unique index if not exists uk_applications_application_number
  on applications(application_number)
  where application_number is not null;

alter table if exists payments
  add column if not exists qpay_invoice_id varchar(255);

alter table if exists payments
  add column if not exists qpay_payment_id varchar(255);

alter table if exists payments
  add column if not exists sender_invoice_no varchar(255);

alter table if exists payments
  add column if not exists qr_text text;

alter table if exists payments
  add column if not exists qr_image text;

alter table if exists payments
  add column if not exists deeplinks_json text;

alter table if exists payments
  add column if not exists status varchar(255) default 'NEW';

alter table if exists payments
  add column if not exists amount integer default 0;

alter table if exists payments
  add column if not exists paid_at timestamp;

update payments
set status = 'NEW'
where status is null;
