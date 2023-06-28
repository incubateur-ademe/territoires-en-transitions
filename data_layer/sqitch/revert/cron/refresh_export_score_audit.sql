-- Revert tet:cron/refresh_export_score_audit from pg

BEGIN;

select cron.unschedule('refresh_export_score_audit');

COMMIT;
