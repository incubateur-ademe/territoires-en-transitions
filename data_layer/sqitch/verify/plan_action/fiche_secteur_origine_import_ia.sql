-- Verify tet:plan_action/fiche_secteur_origine_import_ia on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT pg_get_constraintdef(oid) LIKE '%import_ia%'
        FROM pg_constraint
        WHERE conname = 'fiche_action_secteur_attribution_origine_check'
    ), 'L origine import_ia doit etre admise';

    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'fiche_action_secteur_attribution'
          AND column_name = 'justification'
          AND is_nullable = 'YES'
    ), 'La colonne justification doit exister, NULLABLE';
END $$;

ROLLBACK;
