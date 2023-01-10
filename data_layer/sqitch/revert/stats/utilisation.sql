-- Revert tet:stats/utilisation from pg

BEGIN;

drop function stats.refresh_views_utilisation;
drop materialized view stats.evolution_usage_fonction;
drop materialized view stats.evolution_visite;
drop materialized view stats.evolution_utilisateur_unique_quotidien;
drop materialized view stats.evolution_utilisateur_unique_mensuel;

COMMIT;
