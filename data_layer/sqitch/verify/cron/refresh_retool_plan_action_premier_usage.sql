-- Verify tet:cron/refresh_retool_plan_action_premier_usage on pg

BEGIN;

select 1/count(*) from cron.job where jobname = 'refresh_retool_plan_action_premier_usage';

ROLLBACK;
