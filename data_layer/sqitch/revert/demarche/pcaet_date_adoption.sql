-- Revert tet:demarche/pcaet_date_adoption from pg

BEGIN;

ALTER TABLE public.demarche DROP COLUMN adopted_at;

COMMIT;
