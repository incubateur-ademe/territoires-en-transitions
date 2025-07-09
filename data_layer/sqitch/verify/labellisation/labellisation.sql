-- Verify tet:labellisation/labellisation on pg

BEGIN;

select has_function_privilege('labellisation.update_labellisation()', 'execute');

ROLLBACK;
