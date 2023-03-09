-- Verify tet:utilisateur/membre on pg

BEGIN;

select has_function_privilege('update_collectivite_membre_niveau_acces(integer, uuid, niveau_acces)', 'execute');

ROLLBACK;
