-- Verify tet:referentiel/vue_tabulaire on pg

BEGIN;

select action_id,
       referentiel,
       descendants,
       leaves,
       have_children,
       ascendants,
       depth,
       type
from private.action_hierarchy
where false;

select action_id,
       referentiel,
       descendants,
       leaves,
       have_children,
       ascendants,
       depth,
       type
from private.action_node
where false;

select action_id,
       referentiel,
       descendants,
       leaves,
       have_children,
       ascendants,
       depth,
       type,
       identifiant,
       nom,
       description,
       phase,
       have_exemples,
       have_preuve,
       have_ressources,
       have_reduction_potentiel,
       have_perimetre_evaluation,
       have_contexte
from action_referentiel
where false;

select has_function_privilege('private.to_tabular_score(private.action_score)', 'execute');

select collectivite_id,
       action_id,
       referentiel,
       type,
       descendants,
       ascendants,
       depth,
       have_children,
       identifiant,
       nom,
       description,
       have_exemples,
       have_preuve,
       have_ressources,
       have_reduction_potentiel,
       have_perimetre_evaluation,
       have_contexte,
       phase,
       score_realise,
       score_programme,
       score_realise_plus_programme,
       score_pas_fait,
       score_non_renseigne,
       points_restants,
       points_realises,
       points_programmes,
       points_max_personnalises,
       points_max_referentiel,
       avancement,
       avancement_detaille,
       avancement_descendants,
       non_concerne
from action_statuts
where false;

ROLLBACK;
