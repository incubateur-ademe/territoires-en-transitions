-- Revert tet:collectivite/collectivite_relations from pg

BEGIN;

drop table if exists collectivite_relations;

COMMIT;
