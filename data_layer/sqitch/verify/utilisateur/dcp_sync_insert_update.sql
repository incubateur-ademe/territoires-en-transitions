-- Verify tet:utilisateur/dcp_sync_insert_update on pg

BEGIN;

select has_function_privilege('utilisateur.sync_dcp()', 'execute');
select 1 from pg_trigger where tgname = 'after_user_insert' and tgrelid = 'auth.users'::regclass;
select 1 from pg_trigger where tgname = 'before_user_update' and tgrelid = 'auth.users'::regclass;

ROLLBACK;
