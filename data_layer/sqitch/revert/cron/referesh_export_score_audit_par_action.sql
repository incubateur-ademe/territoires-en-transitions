-- Revert tet:cron/referesh_export_score_audit_par_action from pg

BEGIN;

select cron.unschedule('refresh_export_score_audit_par_action');

COMMIT;
