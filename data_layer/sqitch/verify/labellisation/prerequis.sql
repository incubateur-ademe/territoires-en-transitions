-- Verify tet:labellisation/prerequis on pg

BEGIN;

select has_function_privilege('labellisation.etoiles(integer)', 'execute');

ROLLBACK;
