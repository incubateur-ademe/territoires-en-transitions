-- Deploy tet:cron/amplitude to pg

BEGIN;

select cron.schedule('amplitude_send_yesterday_creations',
                     '1 3 * * *', -- tout les jours à 3h02.
                     $$select stats.amplitude_send_yesterday_creations();$$);

COMMIT;
