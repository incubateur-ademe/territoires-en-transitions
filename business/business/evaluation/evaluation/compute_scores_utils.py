import logging
from typing import Dict, List


from business.utils.models.action_statut import (
    ActionStatut,
)
from business.utils.models.action_score import ActionScore
from .action_point_tree import ActionPointTree
from business.utils.models.actions import ActionId
from business.utils.timeit import timeit
from business.utils.models.personnalisation import ActionPersonnalisationConsequence

logger = logging.getLogger()


def update_scores_from_tache_given_statuses(
    point_tree_referentiel: ActionPointTree,
    point_tree_personnalise: ActionPointTree,
    scores: Dict[ActionId, ActionScore],
    potentiels: Dict[ActionId, float],
    tache_id: ActionId,
    status_by_action_id: Dict[str, ActionStatut],
    actions_non_concernes_ids: List[ActionId],
    action_personnalises_ids: List[ActionId],
    actions_desactivees_ids: List[ActionId],
):

    tache_points_personnalise = point_tree_personnalise.get_action_point(tache_id)
    tache_points_referentiel = point_tree_referentiel.get_action_point(tache_id)

    # TODO : find a softer way to tell that points cannot be None once they have been filled by referentiel constructor.
    assert tache_points_referentiel is not None
    assert tache_points_personnalise is not None

    tache_point_potentiel = potentiels[tache_id]

    tache_concerne = tache_id not in actions_non_concernes_ids + actions_desactivees_ids
    tache_is_personnalise = tache_id in action_personnalises_ids
    tache_is_desactive = tache_id in actions_desactivees_ids

    if not tache_concerne:
        scores[tache_id] = ActionScore(
            action_id=tache_id,
            point_fait=0.0,
            point_pas_fait=0.0,
            point_programme=0.0,
            point_non_renseigne=tache_point_potentiel,
            point_potentiel=tache_point_potentiel,
            total_taches_count=1,
            completed_taches_count=1,
            fait_taches_avancement=0,
            programme_taches_avancement=0,
            pas_fait_taches_avancement=0,
            pas_concerne_taches_avancement=1,
            point_referentiel=tache_points_referentiel,
            concerne=tache_concerne,
            # perso
            point_potentiel_perso=tache_points_personnalise
            if tache_is_personnalise and not tache_is_desactive
            else None,
            desactive=tache_is_desactive,
        )
        return

    tache_status = status_by_action_id.get(tache_id)
    if tache_status and tache_status.detailed_avancement:
        point_fait = (
            tache_point_potentiel * tache_status.detailed_avancement.fait
            if tache_concerne
            else 0.0
        )
        point_programme = (
            tache_point_potentiel * tache_status.detailed_avancement.programme
            if tache_concerne
            else 0.0
        )
        point_pas_fait = (
            tache_point_potentiel * tache_status.detailed_avancement.pas_fait
            if tache_concerne
            else 0.0
        )
        point_non_renseigne = 0.0
        completed_taches_count = 1
        fait_taches_avancement = tache_status.detailed_avancement.fait
        programme_taches_avancement = tache_status.detailed_avancement.programme
        pas_fait_taches_avancement = tache_status.detailed_avancement.pas_fait
        pas_concerne_taches_avancement = 1 if not tache_concerne else 0.0

    else:
        point_pas_fait = point_programme = point_fait = 0.0
        point_non_renseigne = tache_point_potentiel
        completed_taches_count = 0
        fait_taches_avancement = (
            programme_taches_avancement
        ) = pas_fait_taches_avancement = pas_concerne_taches_avancement = 0

    scores[tache_id] = ActionScore(
        action_id=tache_id,
        point_pas_fait=point_pas_fait,
        point_programme=point_programme,
        point_non_renseigne=point_non_renseigne,
        point_fait=point_fait,
        point_potentiel=tache_point_potentiel,
        point_referentiel=tache_points_referentiel,
        completed_taches_count=completed_taches_count,
        total_taches_count=1,
        fait_taches_avancement=fait_taches_avancement,
        programme_taches_avancement=programme_taches_avancement,
        pas_fait_taches_avancement=pas_fait_taches_avancement,
        pas_concerne_taches_avancement=pas_concerne_taches_avancement,
        concerne=tache_concerne,
        # perso
        point_potentiel_perso=tache_points_personnalise
        if tache_is_personnalise
        else None,
        desactive=tache_is_desactive,
    )


def update_scores_for_action_given_children_scores(
    point_tree_referentiel: ActionPointTree,
    point_tree_personnalise: ActionPointTree,
    scores: Dict[ActionId, ActionScore],
    potentiels: Dict[ActionId, float],
    action_personnalises_ids: List[ActionId],
    actions_desactivees_ids: List[ActionId],
    action_id: ActionId,
):
    action_children = point_tree_referentiel.get_children(action_id)
    action_point_referentiel = point_tree_referentiel.get_action_point(action_id)
    action_point_personnalise = point_tree_personnalise.get_action_point(action_id)

    action_children_with_scores = [
        child_id for child_id in action_children if child_id in scores
    ]

    point_pas_fait = sum(
        [scores[child_id].point_pas_fait for child_id in action_children_with_scores]
    )

    point_fait = sum(
        [scores[child_id].point_fait for child_id in action_children_with_scores]
    )

    point_programme = sum(
        [scores[child_id].point_programme for child_id in action_children_with_scores]
    )
    point_non_renseigne = sum(
        [
            scores[child_id].point_non_renseigne
            for child_id in action_children_with_scores
        ]
    )
    point_potentiel = potentiels[action_id]
    concerne = (
        any([scores[child_id].concerne for child_id in action_children_with_scores])
        if action_children_with_scores
        else True
    )  # concerne if any action children is concerne
    action_is_personnalise = action_id in action_personnalises_ids
    action_is_desactive = action_id in actions_desactivees_ids
    scores[action_id] = ActionScore(
        action_id=action_id,
        point_fait=point_fait,
        point_pas_fait=point_pas_fait,
        point_programme=point_programme,
        point_non_renseigne=point_non_renseigne,
        point_potentiel=point_potentiel,
        completed_taches_count=sum(
            [
                scores[child_id].completed_taches_count
                for child_id in action_children_with_scores
            ]
        ),
        total_taches_count=sum(
            [
                scores[child_id].total_taches_count if child_id in scores else 1
                for child_id in action_children
            ]
        ),
        fait_taches_avancement=sum(
            [
                scores[child_id].fait_taches_avancement
                for child_id in action_children_with_scores
            ]
        ),
        programme_taches_avancement=sum(
            [
                scores[child_id].programme_taches_avancement
                for child_id in action_children_with_scores
            ]
        ),
        pas_fait_taches_avancement=sum(
            [
                scores[child_id].pas_fait_taches_avancement
                for child_id in action_children_with_scores
            ]
        ),
        pas_concerne_taches_avancement=sum(
            [
                scores[child_id].pas_concerne_taches_avancement
                for child_id in action_children_with_scores
            ]
        ),
        point_referentiel=action_point_referentiel,
        concerne=concerne,
        # perso
        point_potentiel_perso=action_point_personnalise
        if action_is_personnalise and not action_is_desactive
        else None,
        desactive=action_is_desactive,
    )


def _get_non_concerne_action_ids(
    action_id: ActionId,
    actions_non_concernes_ids: List[ActionId],
    point_tree: ActionPointTree,
):
    if action_id in actions_non_concernes_ids:
        return
    children = point_tree.get_children(action_id)
    if children and all([child in actions_non_concernes_ids for child in children]):
        actions_non_concernes_ids.append(action_id)


@timeit("compute_actions_non_concernes_ids")
def compute_actions_non_concernes_ids(
    point_tree: ActionPointTree, statuses: List[ActionStatut]
):
    taches_non_concernes_ids = [
        action_status.action_id
        for action_status in statuses
        if not action_status.concerne
    ]

    # 1. First, calculate all potentiels after 'non concernee' action's points redistribution
    actions_non_concernes_ids = taches_non_concernes_ids
    point_tree.map_from_taches_to_root(
        lambda action_id: _get_non_concerne_action_ids(
            action_id, actions_non_concernes_ids, point_tree
        )
    )
    return actions_non_concernes_ids


@timeit("compute_actions_desactivees_ids")
def compute_actions_desactivees_ids(
    point_tree_personnalise: ActionPointTree,
    actions_personnalises_desactivees_ids: List[ActionId],
) -> List[ActionId]:
    all_actions_desactivees_ids = []
    for action_id in actions_personnalises_desactivees_ids:
        point_tree_personnalise.map_from_action_to_taches(
            lambda child_id: all_actions_desactivees_ids.append(child_id),
            action_id,
        )
    return all_actions_desactivees_ids


def _get_action_potentiel_after_redistribution_for_level_greater_than_action_level(
    action_id: ActionId,
    original_action_potentiel: float,
    actions_non_concernes_ids: List[ActionId],
    point_tree_personnalise: ActionPointTree,
):
    # If some siblings are non concernes, redistribute their points
    action_siblings = point_tree_personnalise.get_siblings(action_id)
    action_sibling_is_non_concerne = [
        action_id in actions_non_concernes_ids for action_id in action_siblings
    ]

    if any(action_sibling_is_non_concerne) and not all(
        action_sibling_is_non_concerne
    ):  # Some (but not all) actions are 'non-concernes'
        siblings_non_concernes = set(action_siblings).intersection(
            set(actions_non_concernes_ids)
        )
        siblings_concernes = set(action_siblings).difference(
            set(siblings_non_concernes)
        )
        points_non_concerne_to_redistribute = sum(
            [
                point_tree_personnalise.get_action_point(action_id)
                for action_id in siblings_non_concernes
            ]
        )
        actions_to_redistribute_amongst = [
            action_id
            for action_id in siblings_concernes
            if point_tree_personnalise.get_action_point(action_id) != 0
        ]
        if action_id in actions_to_redistribute_amongst:
            return original_action_potentiel + points_non_concerne_to_redistribute / (
                len(actions_to_redistribute_amongst)
            )
    return original_action_potentiel


@timeit("compute_potentiels")
def compute_potentiels(
    point_tree_personnalise: ActionPointTree,
    actions_non_concernes_ids: List[ActionId],
    action_level: int,
) -> Dict[ActionId, float]:

    potentiels = {}

    def _add_action_potentiel_after_redistribution(
        action_id: ActionId,
    ):
        this_level = point_tree_personnalise._depths_by_action_ids[action_id]
        children = point_tree_personnalise.get_children(action_id)
        if not children:  # tache
            original_action_potentiel = (
                0
                if action_id in actions_non_concernes_ids
                else point_tree_personnalise.get_action_point(action_id)
            )
        else:
            original_action_potentiel = sum(
                [
                    potentiels[child_id]
                    for child_id in point_tree_personnalise.get_children(action_id)
                ]
            )

        if this_level > action_level:
            potentiel = _get_action_potentiel_after_redistribution_for_level_greater_than_action_level(
                action_id,
                original_action_potentiel,
                actions_non_concernes_ids,
                point_tree_personnalise,
            )
            potentiels[action_id] = potentiel
        else:
            potentiels[action_id] = original_action_potentiel

    point_tree_personnalise.map_from_taches_to_root(
        lambda action_id: _add_action_potentiel_after_redistribution(
            action_id,
        )
    )

    def _resize_children_potentiels(action_id: ActionId):
        action_potentiel = potentiels[action_id]
        action_referentiel_points = point_tree_personnalise.get_action_point(action_id)
        if action_potentiel != action_referentiel_points:
            children = point_tree_personnalise.get_children(action_id)
            if not children:
                return

            for child_id in children:
                new_child_potentiel = (
                    (
                        potentiels[child_id]
                        / action_referentiel_points
                        * action_potentiel
                    )
                    if action_referentiel_points
                    else 0.0
                )
                potentiels[child_id] = new_child_potentiel

    point_tree_personnalise.map_from_actions_to_taches(
        lambda action_id: _resize_children_potentiels(
            action_id,
        ),
        action_level,
    )
    return potentiels


@timeit("build_point_tree_personnalise")
def build_point_tree_personnalise(
    point_tree_referentiel: ActionPointTree,
    personnalisation_consequences: Dict[ActionId, ActionPersonnalisationConsequence],
) -> ActionPointTree:
    point_tree_personnalise = point_tree_referentiel.clone()
    for action_id, consequence in personnalisation_consequences.items():
        if consequence.potentiel_perso is not None:
            factor = consequence.potentiel_perso
            personnalisation = (
                lambda action_id: point_tree_personnalise.set_action_point(
                    action_id,
                    point_tree_personnalise.get_action_point(action_id) * factor,
                )
            )
            point_tree_personnalise.map_from_action_to_taches(
                personnalisation,
                action_id,
            )
    return point_tree_personnalise
