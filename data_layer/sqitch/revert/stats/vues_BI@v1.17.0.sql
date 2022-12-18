-- Revert tet:stats/vues_BI from pg

BEGIN;

drop function stats.refresh_views();
drop materialized view stats.collectivite_action_statut;
drop materialized view stats.collectivite_plan_action;
drop materialized view stats.collectivite_utilisateur;
drop materialized view stats.collectivite_referentiel;
drop materialized view stats.collectivite_labellisation;
drop materialized view stats.collectivite;
drop view stats.monthly_bucket;
drop table stats.iso_3166;

COMMIT;
