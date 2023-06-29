-- Verify tet:labellisation/prerequis on pg

BEGIN;

select has_function_privilege('labellisation.critere_action(integer)', 'execute');

ROLLBACK;
