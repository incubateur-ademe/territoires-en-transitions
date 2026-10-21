-- Revert tet:demarche/pcaet_plan_actions_tableurs from pg

BEGIN;

ALTER TABLE public.demarche_document_definition
    DROP COLUMN mime_types_autorises,
    DROP COLUMN formats_autorises;

COMMIT;
