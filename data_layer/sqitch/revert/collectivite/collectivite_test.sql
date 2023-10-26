-- Revert tet:collectivite/collectivite_test from pg

BEGIN;

drop function delete_collectivite_test;

COMMIT;
