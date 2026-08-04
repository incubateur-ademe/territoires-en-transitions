-- Revert tet:demarche/demarche from pg

BEGIN;

DROP TABLE IF EXISTS public.demarche_status_history CASCADE;
DROP TABLE IF EXISTS public.demarche_pilote CASCADE;
DROP TABLE IF EXISTS public.demarche CASCADE;

COMMIT;
