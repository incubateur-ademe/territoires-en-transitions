-- Revert tet:utilisateur/add-programme-tete-column-to-utilisateur-support from pg

BEGIN;

ALTER TABLE utilisateur_support
DROP COLUMN IF EXISTS has_role_tete_admin;

COMMIT;
