-- Deploy tet:cron/refresh_stats_labellisation to pg

BEGIN;

select cron.schedule('refresh_stats_derniere_labellisation',
                     '0 1 * * *', -- tout les jours à 1h.
                     $$select stats.stats_derniere_labellisation();$$);

COMMIT;
