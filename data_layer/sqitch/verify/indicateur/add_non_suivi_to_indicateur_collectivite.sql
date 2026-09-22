-- Verify tet:indicateur/add_non_suivi_to_indicateur_collectivite on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT COUNT(*) = 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'indicateur_collectivite'
        AND column_name = 'non_suivi' AND data_type = 'boolean' AND is_nullable = 'NO'
    ), 'La colonne indicateur_collectivite.non_suivi doit exister, être de type boolean et NOT NULL';
END $$;

ROLLBACK;
