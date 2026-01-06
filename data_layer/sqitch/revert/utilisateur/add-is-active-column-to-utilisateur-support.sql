-- Revert tet:utilisateur/add-is-active-column-to-utilisateur-support from pg

BEGIN;

ALTER TABLE utilisateur_support
DROP COLUMN IF EXISTS is_support_mode_enabled;

COMMIT;
