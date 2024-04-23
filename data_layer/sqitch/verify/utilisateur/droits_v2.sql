-- Verify tet:utilisateur/droits_v2 on pg

BEGIN;

select has_function_privilege('claim_collectivite(integer, membre_fonction, text, referentiel[], boolean)', 'execute');

ROLLBACK;
