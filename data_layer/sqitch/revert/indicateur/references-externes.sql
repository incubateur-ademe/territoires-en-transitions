-- Revert tet:indicateur/references-externes from pg
BEGIN;
DROP TABLE public.indicateur_reference_externe;
COMMIT;
