-- Deploy tet:cron/refresh_retool_plan_action_premier_usage to pg

BEGIN;

select cron.schedule('refresh_retool_plan_action_premier_usage',
                     '0 0 * * *', -- every day
                     $$refresh materialized view private.retool_plan_action_premier_usage$$);

COMMIT;
