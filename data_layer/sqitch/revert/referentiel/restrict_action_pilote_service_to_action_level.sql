-- Revert tet:referentiel/restrict_action_pilote_service_to_action_level from pg

BEGIN;

DROP TRIGGER IF EXISTS check_action_level ON action_service;
DROP TRIGGER IF EXISTS check_action_level ON action_pilote;

DROP FUNCTION IF EXISTS private.check_action_pilote_service_action_level();
DROP FUNCTION IF EXISTS private.action_id_is_action_level(action_id);

COMMIT;
