-- Revert tet:referentiel/action_pilote from pg

BEGIN;

DROP TABLE action_pilote;

COMMIT;
