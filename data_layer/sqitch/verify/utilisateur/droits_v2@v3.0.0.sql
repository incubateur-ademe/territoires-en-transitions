-- Verify tet:utilisateur/droits_v2 on pg

BEGIN;

select has_function_privilege('collectivite_membres(integer)', 'execute');

ROLLBACK;
