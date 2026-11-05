-- Revert tet:collectivite/fichier_scan from pg

BEGIN;

DROP TABLE IF EXISTS public.collectivite_fichier_scan;

COMMIT;
