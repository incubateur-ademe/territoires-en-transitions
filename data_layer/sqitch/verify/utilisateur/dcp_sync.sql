-- Verify tet:utilisateur/dcp_sync on pg

BEGIN;

select has_function_privilege('utilisateur.sync_dcp()', 'execute');
comment on trigger before_user_update on auth.users is '';

ROLLBACK;
