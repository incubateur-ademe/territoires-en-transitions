-- Verify tet:stats/drop_amplitude on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS(SELECT FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'stats' AND p.proname LIKE 'amplitude%')
    THEN
        RAISE EXCEPTION 'Une fonction stats.amplitude_* existe encore';
    END IF;

    IF EXISTS(SELECT FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
              WHERE n.nspname = 'stats' AND t.typname LIKE 'amplitude%')
    THEN
        RAISE EXCEPTION 'Une table ou un type stats.amplitude_* existe encore';
    END IF;

    IF EXISTS(SELECT FROM cron.job WHERE jobname LIKE 'amplitude%')
    THEN
        RAISE EXCEPTION 'Un cron amplitude existe encore';
    END IF;
END $$;

ROLLBACK;
