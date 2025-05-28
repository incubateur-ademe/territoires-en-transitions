-- Verify tet:referentiel/vues on pg

BEGIN;

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
       have_questions,
       phase
from action_definition_summary
where false;

ROLLBACK;
