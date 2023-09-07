-- Verify tet:plan_action/export on pg

BEGIN;

select has_function_privilege('plan_action_export(integer)', 'execute');

ROLLBACK;
