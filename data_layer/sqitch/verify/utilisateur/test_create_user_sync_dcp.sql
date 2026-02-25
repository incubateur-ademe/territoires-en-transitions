-- Verify tet:utilisateur/test_create_user_sync_dcp on pg

select has_function_privilege('public.test_create_user(uuid, text, text, text)', 'execute');
