-- Verify tet:cron/cron on pg

BEGIN;

select has_function_privilege('cron.schedule(text, text, text)', 'execute');

ROLLBACK;
