-- Deploy tet:cron/refresh_stats_utilisateur to pg
-- requires: stats/utilisateur
-- requires: cron/cron

BEGIN;

select cron.schedule('refresh_stats_utilisateur',
                     '0 0 * * *', -- every day
                     $$refresh materialized view stats_unique_active_users$$);

COMMIT;
