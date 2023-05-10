-- Revert tet:cron/amplitude from pg

BEGIN;

select cron.unschedule('amplitude_send_yesterday_events');

COMMIT;
