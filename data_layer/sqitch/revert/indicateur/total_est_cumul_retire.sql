-- Revert tet:indicateur/total_est_cumul_retire from pg

BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.indicateur_definition
    ADD COLUMN total_est_cumul_des_sous_indicateurs boolean NOT NULL DEFAULT true;

COMMIT;
