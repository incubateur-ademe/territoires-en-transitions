-- Verify tet:labellisation/drop_add_bibliotheque_fichier on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'add_bibliotheque_fichier'
    ) THEN
        RAISE EXCEPTION 'La fonction add_bibliotheque_fichier existe encore';
    END IF;
END $$;

ROLLBACK;
