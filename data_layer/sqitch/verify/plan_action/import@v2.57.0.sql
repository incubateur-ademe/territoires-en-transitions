-- Verify tet:plan_action/import on pg

BEGIN;

select has_function_privilege('import_plan_action_csv()', 'execute');

ROLLBACK;
