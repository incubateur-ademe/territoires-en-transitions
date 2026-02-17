-- Verify tet:indicateur/delete_metadonnee_perf on pg

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_indexes WHERE indexname = 'idx_indicateur_valeur_metadonnee_id'
    ) THEN
        RAISE EXCEPTION 'Index idx_indicateur_valeur_metadonnee_id does not exist';
    END IF;
END $$;

ROLLBACK;
