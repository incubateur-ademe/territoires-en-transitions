-- Revert tet:action_statut from pg

BEGIN;

drop table action_statut_update_event;
drop view business_action_statut;
drop view client_action_statut;
drop table action_statut;
drop function private.check_avancement_detaille_sum();
drop type avancement;

COMMIT;
