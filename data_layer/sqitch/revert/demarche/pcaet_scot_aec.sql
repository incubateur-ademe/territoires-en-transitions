-- Revert tet:demarche/pcaet_scot_aec from pg

BEGIN;

ALTER TABLE public.demarche DROP COLUMN is_scot_aec;

COMMIT;
