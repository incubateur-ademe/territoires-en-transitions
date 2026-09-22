-- Revert tet:indicateur/add_non_suivi_to_indicateur_collectivite from pg

BEGIN;

ALTER TABLE indicateur_collectivite
DROP COLUMN IF EXISTS non_suivi;

COMMIT;
