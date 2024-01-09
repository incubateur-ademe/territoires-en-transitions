-- Verify tet:indicateur/confidentialite on pg

BEGIN;

select has_function_privilege('confidentiel(indicateur_definitions)', 'execute');

ROLLBACK;
