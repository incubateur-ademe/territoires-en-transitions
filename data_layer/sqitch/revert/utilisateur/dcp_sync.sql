-- Revert tet:utilisateur/dcp_sync from pg

BEGIN;

drop trigger before_user_update on auth.users;
drop function utilisateur.sync_dcp;

COMMIT;
