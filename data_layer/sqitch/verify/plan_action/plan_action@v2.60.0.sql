-- Verify tet:plan_action on pg

BEGIN;

select has_function_privilege('deplacer_fiche_action_dans_un_axe(integer, integer, integer)', 'execute');

ROLLBACK;
