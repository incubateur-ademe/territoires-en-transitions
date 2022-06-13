-- Verify tet:scores_events on pg

BEGIN;

select collectivite_id, referentiel, created_at
from unprocessed_action_statut_update_event
where false;

ROLLBACK;
