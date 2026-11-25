-- Deploy tet:indicateur/total_est_cumul_remis_a_faux to pg
-- requires: indicateur/total_est_cumul_des_sous_indicateurs

BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.indicateur_definition
    ALTER COLUMN total_est_cumul_des_sous_indicateurs SET DEFAULT false;

UPDATE public.indicateur_definition
SET total_est_cumul_des_sous_indicateurs = false
WHERE total_est_cumul_des_sous_indicateurs;

COMMIT;
