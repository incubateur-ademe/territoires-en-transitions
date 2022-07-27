-- Revert tet:retool/collectivite from pg

BEGIN;

drop view retool_active_collectivite;

COMMIT;
