-- Verify tet:utilisateur/droits_v2 on pg

BEGIN;

select has_function_privilege('est_verifie()', 'execute');
select has_function_privilege('can_read_acces_restreint(integer)', 'execute');

ROLLBACK;
