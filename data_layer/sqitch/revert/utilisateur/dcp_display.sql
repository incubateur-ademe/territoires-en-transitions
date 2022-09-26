-- Revert tet:utilisateur/dcp_display from pg

BEGIN;

drop view utilisateur.dcp_display;

COMMIT;
