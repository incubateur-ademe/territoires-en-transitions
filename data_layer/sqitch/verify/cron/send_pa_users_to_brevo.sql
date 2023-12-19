-- Verify tet:cron/send_pa_users_to_brevo on pg

BEGIN;

select 1/count(*) from cron.job where jobname = 'send_pa_users_to_brevo';

ROLLBACK;
