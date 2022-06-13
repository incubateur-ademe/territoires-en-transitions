-- Revert tet:collectivite/region from pg

BEGIN;

drop view region;

COMMIT;
