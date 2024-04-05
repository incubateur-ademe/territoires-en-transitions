-- Verify tet:utilisateur/droits_v2 on pg

BEGIN;

select has_function_privilege('valider_audit(integer)', 'execute');

ROLLBACK;
