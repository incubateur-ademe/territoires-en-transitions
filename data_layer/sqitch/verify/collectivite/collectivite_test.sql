-- Verify tet:collectivite/collectivite_test on pg

BEGIN;

select has_function_privilege('delete_collectivite_test(integer)', 'execute');

ROLLBACK;
