-- Verify tet:utilisateur/add-is-active-column-to-utilisateur-support on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'utilisateur_support'
        AND column_name = 'is_support_mode_enabled'
        AND data_type = 'boolean'
        AND is_nullable = 'NO'
    ), 'La colonne is_support_mode_enabled doit exister dans utilisateur_support avec le bon type';
END $$;

ROLLBACK;
