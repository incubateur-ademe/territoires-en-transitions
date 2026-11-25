-- Deploy tet:indicateur/total_est_cumul_retire to pg
-- requires: indicateur/total_est_cumul_des_sous_indicateurs

BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.indicateur_definition
    DROP COLUMN total_est_cumul_des_sous_indicateurs;

COMMIT;
