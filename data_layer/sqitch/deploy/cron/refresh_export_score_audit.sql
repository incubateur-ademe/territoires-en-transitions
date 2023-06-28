-- Deploy tet:cron/refresh_export_score_audit to pg

BEGIN;

select cron.schedule('refresh_export_score_audit',
                     '0 0 * * *', -- every day
                     $$refresh materialized view labellisation.export_score_audit$$);


COMMIT;
