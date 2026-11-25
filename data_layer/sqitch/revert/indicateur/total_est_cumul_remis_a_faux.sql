-- Revert tet:indicateur/total_est_cumul_remis_a_faux from pg

BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.indicateur_definition
    ALTER COLUMN total_est_cumul_des_sous_indicateurs SET DEFAULT true;

UPDATE public.indicateur_definition
SET total_est_cumul_des_sous_indicateurs = true
WHERE NOT total_est_cumul_des_sous_indicateurs;

COMMIT;
