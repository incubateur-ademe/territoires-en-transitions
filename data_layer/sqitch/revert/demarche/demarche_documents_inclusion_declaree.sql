-- Revert tet:demarche/demarche_documents_inclusion_declaree from pg

BEGIN;

UPDATE public.demarche_document_definition
SET nom         = 'Document global',
    description = 'Document unique regroupant l''ensemble des pièces attendues. Son dépôt couvre toutes les sections du dossier.',
    modified_at = now()
WHERE id = 'pcaet_document_global';

ALTER TABLE public.demarche_document_substitution
    DROP COLUMN automatic;

COMMIT;
