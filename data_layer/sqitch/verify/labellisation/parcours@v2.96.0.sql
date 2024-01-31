-- Verify tet:labellisation/parcours on pg

BEGIN;

select has_function_privilege('labellisation_parcours(integer)', 'execute');

ROLLBACK;
