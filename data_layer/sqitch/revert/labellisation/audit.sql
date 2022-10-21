-- Revert tet:labellisation/audit from pg

BEGIN;

drop view get_action_audit_state_list;
drop function get_current_audit(col integer, ref referentiel);
drop function set_audit_id();
drop table action_audit_state;
drop table audit;
drop type audit_statut;

COMMIT;