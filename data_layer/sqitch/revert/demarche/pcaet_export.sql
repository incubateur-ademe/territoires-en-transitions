-- Revert tet:demarche/pcaet_export from pg

BEGIN;

DROP TABLE IF EXISTS public.demarche_pcaet_export;

COMMIT;
