-- Deploy tet:labellisation/cot to pg

BEGIN;

drop trigger before_insert on cot;
drop function before_insert_add_default_signataire;
drop function if exists test_set_cot;
alter table cot
drop column signataire;

COMMIT;
