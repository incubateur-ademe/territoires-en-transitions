-- Verify tet:plan_action/tableau_de_bord on pg

BEGIN;

select has_function_privilege('plan_action_tableau_de_bord(integer, integer, boolean)', 'execute');

ROLLBACK;
