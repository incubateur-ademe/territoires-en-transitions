-- Deploy tet:cron/refresh_stats_collectivite to pg
-- requires: stats/collectivite
-- requires: cron/cron

BEGIN;

select cron.schedule('refresh_stats_collectivite',
                     '0 0 * * *', -- every day
                     $$refresh materialized view stats_unique_active_collectivite; refresh materialized view stats_rattachements;$$);

COMMIT;
