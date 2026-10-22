-- Revert tet:demarches/pcaet_referent from pg

BEGIN;

DROP TABLE IF EXISTS public.demarche_pcaet_referent;

COMMIT;
