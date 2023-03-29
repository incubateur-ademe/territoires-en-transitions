-- Deploy tet:labellisation/audit to pg
BEGIN;

drop function labellisation_cloturer_audit;
drop function labellisation_peut_commencer_audit;

COMMIT;
