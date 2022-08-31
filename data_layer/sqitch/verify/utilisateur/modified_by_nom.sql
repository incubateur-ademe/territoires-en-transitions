-- Verify tet:utilisateur/modified_by_nom on pg

BEGIN;

select has_function_privilege('utilisateur.modified_by_nom(uuid)', 'execute');

ROLLBACK;
