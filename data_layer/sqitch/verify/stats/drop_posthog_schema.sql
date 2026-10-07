-- Verify tet:stats/drop_posthog_schema on pg

BEGIN;

DO $$
BEGIN
    IF to_regnamespace('posthog') IS NOT NULL
    THEN
        RAISE EXCEPTION 'Le schéma posthog existe encore';
    END IF;

    IF EXISTS(SELECT FROM cron.job WHERE jobname = 'posthog_send_yesterday_events')
    THEN
        RAISE EXCEPTION 'Le cron posthog_send_yesterday_events existe encore';
    END IF;
END $$;

ROLLBACK;
