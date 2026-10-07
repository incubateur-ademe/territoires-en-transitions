-- Revert tet:demarche/demarche_documents_additional from pg

BEGIN;

DROP TABLE IF EXISTS public.demarche_document_additional CASCADE;
DROP TABLE IF EXISTS public.demarche_definition CASCADE;

COMMIT;
