-- Verify tet:plan_action on pg

BEGIN;

select has_function_privilege('delete_axe_all(integer)', 'execute');

ROLLBACK;
