-- Verify tet:indicateur/total_est_cumul_des_sous_indicateurs on pg

BEGIN;

SELECT total_est_cumul_des_sous_indicateurs
FROM public.indicateur_definition
WHERE false;

ROLLBACK;
