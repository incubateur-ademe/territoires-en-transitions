-- Verify tet:indicateur/filtre on pg

BEGIN;

select has_function_privilege('axes(indicateur_definitions)', 'execute');

ROLLBACK;
