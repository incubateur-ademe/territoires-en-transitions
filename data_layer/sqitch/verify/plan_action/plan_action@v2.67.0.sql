-- Verify tet:plan_action on pg

BEGIN;

select has_function_privilege('ajouter_fiche_action_dans_un_axe(integer, integer)', 'execute');
select has_function_privilege('enlever_fiche_action_d_un_axe(integer, integer)', 'execute');

ROLLBACK;
