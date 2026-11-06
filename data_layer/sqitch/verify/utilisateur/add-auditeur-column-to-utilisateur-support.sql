-- Verify tet:utilisateur/add-auditeur-column-to-utilisateur-support on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'utilisateur_support'
        AND column_name = 'has_role_tete_auditeur'
        AND data_type = 'boolean'
        AND is_nullable = 'NO'
    ), 'La colonne has_role_tete_auditeur doit exister dans utilisateur_support avec le bon type';
END $$;

ROLLBACK;
