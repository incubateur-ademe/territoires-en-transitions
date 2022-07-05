-- Deploy tet:cron/refresh_stats_completude to pg
-- requires: stats/completude
-- requires: cron/cron

BEGIN;

select cron.schedule('refresh_stats_completude',
                     '0 0 * * *', -- every day
                     $$refresh materialized view stats_tranche_completude$$);


COMMIT;
