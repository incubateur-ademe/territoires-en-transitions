-- Revert tet:demarche/pcaet_date_saisine from pg

BEGIN;

DROP TABLE IF EXISTS public.demarche_pcaet_date_saisine;

COMMIT;
