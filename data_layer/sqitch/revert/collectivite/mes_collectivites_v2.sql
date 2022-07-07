-- Revert tet:collectivite/mes_collectivites_v2 from pg

BEGIN;

drop view elses_collectivite;

COMMIT;
