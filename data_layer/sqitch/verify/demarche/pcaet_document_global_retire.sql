-- Verify tet:demarche/pcaet_document_global_retire on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT retired_at IS NOT NULL
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_document_global'
    ), 'Le PCAET global doit être retiré du catalogue';
END $$;

ROLLBACK;
