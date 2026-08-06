-- Revert tet:demarche/demarche_documents from pg

BEGIN;

DROP TABLE IF EXISTS public.demarche_document_couverture CASCADE;
DROP TABLE IF EXISTS public.demarche_document CASCADE;
DROP TABLE IF EXISTS public.demarche_document_substitution CASCADE;
DROP TABLE IF EXISTS public.demarche_document_definition CASCADE;

COMMIT;
