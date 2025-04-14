-- Revert tet:utilisateur/export_connect from pg

BEGIN;

drop table utilisateur.export_connect;

COMMIT;
