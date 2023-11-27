-- Deploy tet:labellisation/export to pg

BEGIN;

drop view public.export_score_audit_par_action;
drop materialized view labellisation.export_score_audit_par_action;

COMMIT;
