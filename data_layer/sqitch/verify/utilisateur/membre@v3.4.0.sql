-- Verify tet:utilisateur/membre on pg

BEGIN;

select has_function_privilege('remove_membre_from_collectivite(integer, text)', 'execute');

ROLLBACK;
