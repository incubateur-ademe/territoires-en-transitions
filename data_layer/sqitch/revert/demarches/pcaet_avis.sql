-- Revert tet:demarches/pcaet_avis from pg

BEGIN;

DROP TABLE IF EXISTS public.demarche_pcaet_avis;
DROP TABLE IF EXISTS public.demarche_pcaet_demande_avis;

DROP FUNCTION IF EXISTS public.demarche_pcaet_check_collectivite_est_instructeur();

COMMIT;
