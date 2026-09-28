-- Revert tet:indicateur/indicateur_vue from pg

BEGIN;

DROP TABLE public.indicateur_vue;

COMMIT;
