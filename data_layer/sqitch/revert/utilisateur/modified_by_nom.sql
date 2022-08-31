-- Revert tet:utilisateur/modified_by_nom from pg

BEGIN;

drop function utilisateur.modified_by_nom(uuid);

COMMIT;
