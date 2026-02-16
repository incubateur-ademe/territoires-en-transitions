-- Verify tet:utilisateur/dcp_add_rights_search_path on pg

select has_function_privilege('public.after_insert_dcp_add_rights()', 'execute');
