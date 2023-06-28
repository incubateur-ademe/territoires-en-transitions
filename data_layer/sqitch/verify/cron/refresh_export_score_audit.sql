-- Verify tet:cron/refresh_export_score_audit on pg

BEGIN;

select 1/count(*) from cron.job where jobname = 'refresh_export_score_audit';

ROLLBACK;
