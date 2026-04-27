-- Verify tet:utilisateur/drop_claim_collectivite on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'claim_collectivite'
    ) THEN
        RAISE EXCEPTION 'La fonction claim_collectivite existe encore';
    END IF;
END $$;

ROLLBACK;
