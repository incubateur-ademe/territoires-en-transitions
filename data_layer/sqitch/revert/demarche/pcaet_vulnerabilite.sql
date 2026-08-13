-- Revert tet:demarche/pcaet_vulnerabilite from pg

BEGIN;

DROP TABLE IF EXISTS public.demarche_pcaet_vulnerabilite_valeur CASCADE;
DROP TABLE IF EXISTS public.demarche_pcaet_vulnerabilite_domaine CASCADE;

COMMIT;
