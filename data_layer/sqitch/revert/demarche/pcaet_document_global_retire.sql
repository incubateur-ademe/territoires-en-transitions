-- Revert tet:demarche/pcaet_document_global_retire from pg

BEGIN;

ALTER TABLE public.demarche_document_definition
    DROP COLUMN retired_at;

COMMIT;
