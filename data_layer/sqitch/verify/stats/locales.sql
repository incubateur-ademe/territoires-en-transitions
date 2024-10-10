-- Verify tet:stats/locale on pg

BEGIN;

select has_function_privilege('stats.refresh_stats_locales_indicateurs()', 'execute');
select has_function_privilege('stats.refresh_stats_locales()', 'execute');

ROLLBACK;
