-- Revert tet:indicateur/import_emt_valeur from pg

BEGIN;

DROP FUNCTION public.import_indicateur_emt_valeurs(integer, jsonb);

COMMIT;
