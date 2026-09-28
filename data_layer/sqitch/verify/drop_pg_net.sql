-- Verify tet:drop_pg_net on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS(SELECT FROM pg_extension WHERE extname = 'pg_net')
    THEN
        RAISE EXCEPTION 'L''extension pg_net est encore installée';
    END IF;
END $$;

ROLLBACK;
