-- Revert tet:indicateur/delete_metadonnee_perf from pg

BEGIN;

DROP INDEX IF EXISTS idx_indicateur_valeur_metadonnee_id;

COMMIT;
