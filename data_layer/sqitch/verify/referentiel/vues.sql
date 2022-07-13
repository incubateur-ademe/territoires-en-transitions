-- Verify tet:referentiel/vues on pg

BEGIN;

select has_function_privilege('action_perimetre_evaluation(action_id)', 'execute');
select has_function_privilege('action_ressources(action_id)', 'execute');
select has_function_privilege('action_preuve(action_id)', 'execute');
select has_function_privilege('action_contexte(action_id)', 'execute');
select has_function_privilege('action_exemples(action_id)', 'execute');
select has_function_privilege('action_down_to_tache(referentiel, text)', 'execute');
select has_function_privilege('referentiel_down_to_action(referentiel)', 'execute');

select id, referentiel, children, type, identifiant, nom
from action_title
where false;

select id,
       referentiel,
       children,
       depth,
       type,
       identifiant,
       nom,
       description,
       have_exemples,
       have_preuve,
       have_ressources,
       have_reduction_potentiel,
       have_perimetre_evaluation,
       have_contexte,
       have_questions
from action_definition_summary
where false;

select id, children, depth
from action_children
where false;

select referentiel, id, parent, children
from business_action_children
where false;

ROLLBACK;
