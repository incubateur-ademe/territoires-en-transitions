-- Revert tet:utilisateur/schema from pg

BEGIN;

drop schema utilisateur;

COMMIT;
