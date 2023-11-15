-- Verify tet:indicateur/filtre on pg

BEGIN;

select has_function_privilege('thematiques(indicateur_definitions)', 'execute');

ROLLBACK;
