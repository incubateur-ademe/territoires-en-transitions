-- Revert tet:cron/send_pa_users_to_brevo from pg

BEGIN;

select cron.unschedule('send_pa_users_to_brevo');

COMMIT;
