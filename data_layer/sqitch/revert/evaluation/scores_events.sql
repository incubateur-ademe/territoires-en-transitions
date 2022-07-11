-- Revert tet:scores_events from pg

BEGIN;

drop view unprocessed_action_statut_update_event;

COMMIT;
