-- Revert tet:referentiel/action_service from pg

BEGIN;

DROP TABLE action_service;

COMMIT;
