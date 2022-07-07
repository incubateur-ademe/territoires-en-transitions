-- Revert tet:collectivite/mes_collectivites_v2 from pg

BEGIN;

drop view mes_collectivites;
drop view collectivite_niveau_acces;

COMMIT;
