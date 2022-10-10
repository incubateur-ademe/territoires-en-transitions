-- Revert tet:evaluation/action_score from pg

BEGIN;

drop function private.action_score(integer, referentiel);

COMMIT;
