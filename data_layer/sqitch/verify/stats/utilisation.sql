-- Verify tet:stats/utilisation on pg

BEGIN;

select has_function_privilege('stats.refresh_views_utilisation()', 'execute');
select * from stats.evolution_usage_fonction where false;
select * from stats.evolution_visite where false;
select * from stats.evolution_utilisateur_unique_quotidien where false;
select * from stats.evolution_utilisateur_unique_mensuel where false;

ROLLBACK;
