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
from action_hierarchy
where false;

select collectivite_id,
       referentiel,
       action_id,
       concerne,
       desactive,
       point_fait,
       point_pas_fait,
       point_potentiel,
       point_programme,
       point_referentiel,
       total_taches_count,
       point_non_renseigne,
       point_potentiel_perso,
       completed_taches_count,
       fait_taches_avancement,
       pas_fait_taches_avancement,
       programme_taches_avancement,
       pas_concerne_taches_avancement
from private.action_scores
where false;

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
