-- Revert tet:collectivite/historique from pg

BEGIN;

drop view historique;

COMMIT;
