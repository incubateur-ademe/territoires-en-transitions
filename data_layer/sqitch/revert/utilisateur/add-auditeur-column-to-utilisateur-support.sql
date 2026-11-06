-- Revert tet:utilisateur/add-auditeur-column-to-utilisateur-support from pg

BEGIN;

ALTER TABLE utilisateur_support
DROP COLUMN IF EXISTS has_role_tete_auditeur;

COMMIT;
