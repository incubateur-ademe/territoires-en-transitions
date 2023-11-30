-- Deploy tet:cron/referesh_export_score_audit_par_action to pg

BEGIN;

select cron.schedule('refresh_export_score_audit_par_action',
                     '0 0 * * *', -- every day
                     $$refresh materialized view labellisation.export_score_audit_par_action$$);

COMMIT;
