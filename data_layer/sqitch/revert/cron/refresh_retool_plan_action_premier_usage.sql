-- Revert tet:cron/refresh_retool_plan_action_premier_usage from pg

BEGIN;

select cron.unschedule('refresh_retool_plan_action_premier_usage');

COMMIT;
