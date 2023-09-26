-- Verify tet:plan_action/import on pg

BEGIN;

select has_function_privilege('import_plan_action_csv()', 'execute');
select has_function_privilege('upsert_axe(text, integer, integer)', 'execute');

ROLLBACK;
