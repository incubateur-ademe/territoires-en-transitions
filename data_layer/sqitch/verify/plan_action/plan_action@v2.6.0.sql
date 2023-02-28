-- Verify tet:plan_action on pg

BEGIN;

select has_function_privilege('plan_action_profondeur(integer, integer)', 'execute');
select has_function_privilege('plan_action(integer)', 'execute');
select axe_id, descendants, parents, depth
from axe_descendants
where false;
select has_function_privilege('filter_fiches_action(integer, integer, integer, uuid, fiche_action_niveaux_priorite, fiche_action_statuts, integer, uuid)', 'execute');

ROLLBACK;
