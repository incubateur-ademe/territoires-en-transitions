-- Verify tet:drop_http_extension on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS(SELECT FROM pg_extension WHERE extname = 'http')
    THEN
        RAISE EXCEPTION 'L''extension http est encore installée';
    END IF;
END $$;

ROLLBACK;
