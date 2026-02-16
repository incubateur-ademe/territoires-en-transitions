-- Verify tet:utilisateur/dcp_drop_accepter_cgu on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'accepter_cgu'
    ) THEN
        RAISE EXCEPTION 'La fonction accepter_cgu existe encore';
    END IF;
END $$;

ROLLBACK;
