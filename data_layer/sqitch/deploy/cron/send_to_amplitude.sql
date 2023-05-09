-- Deploy tet:cron/amplitude to pg

BEGIN;

select cron.schedule('amplitude_send_yesterday_events',
                     '0 3 * * *', -- tout les jours à 3h.
                     $$stats.amplitude_send_yesterday_events();$$);

COMMIT;
