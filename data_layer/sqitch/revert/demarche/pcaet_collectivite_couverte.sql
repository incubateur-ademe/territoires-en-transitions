-- Revert tet:demarche/pcaet_collectivite_couverte from pg

BEGIN;

DROP TABLE IF EXISTS public.demarche_pcaet_collectivite_couverte;
DROP FUNCTION IF EXISTS public.demarche_pcaet_collectivite_couverte_check();

COMMIT;
