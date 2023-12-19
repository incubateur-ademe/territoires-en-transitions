-- Deploy tet:cron/send_pa_users_to_brevo to pg

BEGIN;

select cron.schedule('send_pa_users_to_brevo',
                     '0 0 * * *', -- every day
                     $$select automatisation.send_pa_users_newsletters();$$);

COMMIT;
