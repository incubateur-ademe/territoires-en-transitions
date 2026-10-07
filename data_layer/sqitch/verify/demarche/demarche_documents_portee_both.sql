-- Verify tet:demarche/demarche_documents_portee_both on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT pg_get_constraintdef(oid) LIKE '%both%'
        FROM pg_constraint
        WHERE conrelid = 'public.demarche_document_definition'::regclass
          AND conname = 'demarche_document_definition_etape_check'
    ), 'La portée both doit être acceptée sur les définitions';

    ASSERT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche_document'
          AND column_name = 'etape'
    ), 'La pièce déposée doit porter son temps';

    ASSERT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'demarche_document'
          AND indexname = 'demarche_document_demarche_id_document_id_etape_key'
    ), 'L''unicité doit porter sur (démarche, pièce, temps)';
END $$;

ROLLBACK;
