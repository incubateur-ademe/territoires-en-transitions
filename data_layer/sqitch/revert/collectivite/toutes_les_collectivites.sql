-- Revert tet:collectivite/toutes_les_collectivites from pg

BEGIN;

drop materialized view collectivite_card;
drop table filtre_intervalle;
drop type collectivite_filtre_type;
drop type filterable_type_collectivite;

COMMIT;
