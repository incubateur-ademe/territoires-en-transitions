-- Deploy tet:labellisation/audit to pg
BEGIN;

drop view audits;
drop trigger on_audit_update on audit;
drop function labellisation.update_audit;

COMMIT;
