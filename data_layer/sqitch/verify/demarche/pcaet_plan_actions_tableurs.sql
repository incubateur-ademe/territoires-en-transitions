-- Verify tet:demarche/pcaet_plan_actions_tableurs on pg

BEGIN;

SELECT formats_autorises, mime_types_autorises
FROM public.demarche_document_definition
WHERE FALSE;

SELECT 1 / COUNT(*)
FROM public.demarche_document_definition
WHERE id = 'pcaet_plan_actions'
  AND formats_autorises = ARRAY['pdf', 'xlsx', 'csv'];

ROLLBACK;
