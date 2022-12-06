-- Revert tet:stats/vues_BI from pg

BEGIN;

drop materialized view stats.collectivite_utilisateur;
drop materialized view stats.collectivite_referentiel;
drop materialized view stats.collectivite_labellisation;
drop materialized view stats.collectivite;
drop function stats.refresh_views();

COMMIT;
