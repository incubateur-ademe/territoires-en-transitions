-- Verify tet:referentiel/action_service on pg

BEGIN;

SELECT collectivite_id, action_id, service_tag_id
FROM action_service
WHERE FALSE;

ROLLBACK;
