-- Revert tet:demarche/pcaet_diagnostic_indicateur_source_metadonnee from pg

BEGIN;

DROP TABLE IF EXISTS public.demarche_pcaet_source_metadonnee;

COMMIT;

