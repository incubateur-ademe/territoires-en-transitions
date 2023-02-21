-- Verify tet:plan_action on pg

BEGIN;

select has_function_privilege('plan_action_profondeur(integer, integer)', 'execute');
select has_function_privilege('plan_action(integer)', 'execute');

ROLLBACK;
