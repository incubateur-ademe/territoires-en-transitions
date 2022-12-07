-- Revert tet:automatisation_schema from pg

BEGIN;

drop schema automatisation;

COMMIT;
