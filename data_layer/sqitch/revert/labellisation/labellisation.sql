-- Deploy tet:labellisation/labellisation to pg

BEGIN;

drop trigger update_labellisation_before_audit_update on labellisation.audit;
drop function labellisation.update_labellisation;

COMMIT;
