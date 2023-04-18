-- Deploy tet:labellisation/cot to pg

BEGIN;

drop trigger before_insert on cot;
drop function before_insert_add_default_signataire;
alter table cot
drop column signataire;

COMMIT;
