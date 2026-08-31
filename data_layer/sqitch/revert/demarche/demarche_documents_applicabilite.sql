-- Revert tet:demarche/demarche_documents_applicabilite from pg

BEGIN;

-- La contrainte part avec la colonne.
ALTER TABLE public.demarche_document_definition
    DROP COLUMN expr_applicable;

COMMIT;
