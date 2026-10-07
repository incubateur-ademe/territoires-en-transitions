-- Verify tet:automatisation/drop_automatisation_schema on pg

BEGIN;

DO $$
BEGIN
    IF to_regnamespace('automatisation') IS NOT NULL
    THEN
        RAISE EXCEPTION 'Le schéma automatisation existe encore';
    END IF;

    IF EXISTS(SELECT FROM cron.job WHERE jobname = 'send_pa_users_to_brevo')
    THEN
        RAISE EXCEPTION 'Le cron send_pa_users_to_brevo existe encore';
    END IF;
END $$;

ROLLBACK;
