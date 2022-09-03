-- Verify tet:utilisateur/modified_by_trigger on pg

BEGIN;

select has_function_privilege('utilisateur.add_modified_by_trigger(text, text)', 'execute');
select has_function_privilege('utilisateur.update_modified_by()', 'execute');

ROLLBACK;
