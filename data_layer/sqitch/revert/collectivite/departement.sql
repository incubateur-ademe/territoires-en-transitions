-- Revert tet:collectivite/departement from pg

BEGIN;

drop view departement;

COMMIT;
