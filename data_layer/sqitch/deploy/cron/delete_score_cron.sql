-- Deploy tet:cron/delete_score_cron to pg

BEGIN;

SELECT cron.unschedule('verification_scores');

SELECT cron.unschedule('update_late_scores');

COMMIT;
