-- Verify tet:demarche/demarche_documents_applicabilite on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT is_nullable = 'YES'
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'demarche_document_definition'
          AND column_name = 'expr_applicable'
    ), 'La condition d''assujettissement doit exister et rester facultative';

    ASSERT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.demarche_document_definition'::regclass
          AND conname = 'demarche_document_definition_expr_applicable_non_vide'
    ), 'Une condition vide doit être rejetée, pour n''avoir qu''une façon de dire « aucune condition »';

    -- Rétro-compatible : le catalogue en place reste attendu de tout le monde.
    ASSERT (
        SELECT count(*) = 0
        FROM public.demarche_document_definition
        WHERE expr_applicable IS NOT NULL
    ), 'Aucune pièce existante ne doit devenir conditionnelle par cette migration';
END $$;

ROLLBACK;
