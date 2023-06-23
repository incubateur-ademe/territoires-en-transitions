-- Verify tet:cron/amplitude on pg

BEGIN;

select 1/count(*) from cron.job where jobname = 'amplitude_send_yesterday_events';

ROLLBACK;
