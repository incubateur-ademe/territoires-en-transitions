-- Revert tet:labellisation/audit from pg

BEGIN;

drop view action_audit_state_list;
drop function labellisation.current_audit(col integer, ref referentiel);
drop function labellisation.audit_id();
drop table action_audit_state;
drop table audit cascade;
drop type audit_statut;

COMMIT;