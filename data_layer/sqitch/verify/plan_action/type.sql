-- Verify tet:plan_action/type on pg

BEGIN;

select has_function_privilege('plan_action_type(axe)', 'execute');

ROLLBACK;
