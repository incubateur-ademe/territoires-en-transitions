-- Deploy tet:cron/amplitude to pg

BEGIN;

select cron.unschedule('amplitude_send_yesterday_creations');

COMMIT;
