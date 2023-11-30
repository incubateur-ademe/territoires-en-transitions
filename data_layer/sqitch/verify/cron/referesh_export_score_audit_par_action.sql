-- Verify tet:cron/referesh_export_score_audit_par_action on pg

BEGIN;

select 1/count(*) from cron.job where jobname = 'refresh_export_score_audit_par_action';

ROLLBACK;
