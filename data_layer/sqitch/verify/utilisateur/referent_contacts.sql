-- Verify tet:utilisateur/referent_contacts on pg

BEGIN;

select has_function_privilege('referent_contacts(integer)', 'execute');

ROLLBACK;
