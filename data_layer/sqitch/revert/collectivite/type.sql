-- Revert tet:collectivite/type from pg

BEGIN;

drop type type_collectivite;

COMMIT;
