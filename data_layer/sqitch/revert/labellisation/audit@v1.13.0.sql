-- Revert tet:labellisation/audit from pg

BEGIN;

drop view public.action_audit_state;
drop function labellisation.upsert_action_audit;
drop function labellisation.current_audit(col integer, ref referentiel);
drop table labellisation.action_audit_state;
drop table audit;
drop type audit_statut;

COMMIT;
