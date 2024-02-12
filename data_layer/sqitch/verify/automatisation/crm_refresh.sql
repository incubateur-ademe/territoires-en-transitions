-- Verify tet:automatisation/crm_refresh on pg

BEGIN;

select has_function_privilege('stats.refresh_views_crm()', 'execute');

ROLLBACK;
