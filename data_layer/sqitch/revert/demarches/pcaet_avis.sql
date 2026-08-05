-- Revert tet:demarches/pcaet_avis from pg

BEGIN;

DROP TABLE IF EXISTS public.pcaet_avis;
DROP TABLE IF EXISTS public.pcaet_demande_avis;

DROP FUNCTION IF EXISTS public.pcaet_check_collectivite_est_instructeur();

COMMIT;
