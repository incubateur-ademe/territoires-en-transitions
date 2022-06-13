-- Revert tet:evaluation/consequence from pg

BEGIN;

drop table personnalisation_consequence;

COMMIT;
