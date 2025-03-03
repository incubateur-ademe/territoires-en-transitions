-- Verify tet:referentiel/action_pilote on pg

BEGIN;

SELECT collectivite_id, action_id, user_id, tag_id
FROM action_pilote
WHERE FALSE;

ROLLBACK;
