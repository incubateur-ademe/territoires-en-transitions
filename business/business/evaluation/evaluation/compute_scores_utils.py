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


def add_tag_renseigne(
    referentiel_tree: ActionPointTree,
    scores: Dict[ActionId, ActionScore],
    action_id: ActionId
):
    if (
            not scores[action_id].desactive and
            scores[action_id].concerne and
            (
                    referentiel_tree._get_parent(action_id) is None or
                    scores[referentiel_tree._get_parent(action_id)].concerne
            ) and
            scores[action_id].point_non_renseigne > 0.0
    ):
        scores[action_id].renseigne = False


def update_action_scores(
        referentiel_tree: ActionPointTree,
        personnalise_tree: ActionPointTree,
        scores: Dict[ActionId, ActionScore],
        potentiels: Dict[ActionId, float],
        action_id: ActionId,
        statuts: Dict[ActionId, ActionStatut],
        action_non_concerne_ids: List[ActionId],
        action_personnalise_ids: List[ActionId],
        action_desactive_ids: List[ActionId],
):
    if referentiel_tree.is_leaf(action_id) \
            or action_id in statuts.keys() \
            or action_id in action_non_concerne_ids:
        update_action_scores_from_status(
            referentiel_tree,
            personnalise_tree,
            scores,
            potentiels,
            action_id,
            statuts,
            action_non_concerne_ids,
            action_personnalise_ids,
            action_desactive_ids,
        )
    else:
        update_action_score_from_children_scores(
            referentiel_tree,
            personnalise_tree,
            scores,
            potentiels,
            action_personnalise_ids,
            action_desactive_ids,
            action_id,
        )


def update_action_scores_from_status(
        point_tree_referentiel: ActionPointTree,
        point_tree_personnalise: ActionPointTree,
        scores: Dict[ActionId, ActionScore],
        potentiels: Dict[ActionId, float],
        action_id: ActionId,
        statuts: Dict[ActionId, ActionStatut],
        actions_non_concerne_ids: List[ActionId],
        action_personnalise_ids: List[ActionId],
        action_desactive_ids: List[ActionId],
):
    """Utilise les statuts d'une tâche ou sous-action pour mettre à jour son score"""
    tache_points_personnalise = point_tree_personnalise.get_action_point(action_id)
    tache_points_referentiel = point_tree_referentiel.get_action_point(action_id)

    assert tache_points_referentiel is not None
    assert tache_points_personnalise is not None

    point_potentiel = potentiels[action_id]

    is_concerne = action_id not in actions_non_concerne_ids
    is_personnalise = action_id in action_personnalise_ids
    is_desactive = action_id in action_desactive_ids
    tache_count = point_tree_referentiel.leaf_count[action_id]

    if not is_concerne:
        scores[action_id] = ActionScore(
            action_id=action_id,
            point_fait=0.0,
            point_pas_fait=0.0,
            point_programme=0.0,
            point_non_renseigne=point_potentiel,
            point_potentiel=point_potentiel,
            total_taches_count=tache_count,
            completed_taches_count=tache_count,
            fait_taches_avancement=0,
            programme_taches_avancement=0,
            pas_fait_taches_avancement=0,
            pas_concerne_taches_avancement=tache_count,
            point_referentiel=tache_points_referentiel,
            concerne=is_concerne,
            # perso
            point_potentiel_perso=tache_points_personnalise
            if is_personnalise and not is_desactive
            else None,
            desactive=is_desactive,
            renseigne=True
        )
        return

    statut = statuts.get(action_id)
    if statut and statut.detailed_avancement:
        point_fait = (
            point_potentiel * statut.detailed_avancement.fait
            if is_concerne
            else 0.0
        )
        point_programme = (
            point_potentiel * statut.detailed_avancement.programme
            if is_concerne
            else 0.0
        )
        point_pas_fait = (
            point_potentiel * statut.detailed_avancement.pas_fait
            if is_concerne
            else 0.0
        )
        point_non_renseigne = 0.0
        completed_taches_count = tache_count
        fait_taches_avancement = statut.detailed_avancement.fait * tache_count
        programme_taches_avancement = statut.detailed_avancement.programme * tache_count
        pas_fait_taches_avancement = statut.detailed_avancement.pas_fait * tache_count
        pas_concerne_taches_avancement = 0.0

    else:
        point_pas_fait = point_programme = point_fait = 0.0
        point_non_renseigne = point_potentiel
        completed_taches_count = 0
        fait_taches_avancement = 0
        programme_taches_avancement = 0
        pas_fait_taches_avancement = 0
        pas_concerne_taches_avancement = 0

    scores[action_id] = ActionScore(
        action_id=action_id,
        point_pas_fait=point_pas_fait,
        point_programme=point_programme,
        point_non_renseigne=point_non_renseigne,
        point_fait=point_fait,
        point_potentiel=point_potentiel,
        point_referentiel=tache_points_referentiel,
        completed_taches_count=completed_taches_count,
        total_taches_count=tache_count,
        fait_taches_avancement=fait_taches_avancement,
        programme_taches_avancement=programme_taches_avancement,
        pas_fait_taches_avancement=pas_fait_taches_avancement,
        pas_concerne_taches_avancement=pas_concerne_taches_avancement,
        concerne=is_concerne,
        # perso
        point_potentiel_perso=tache_points_personnalise
        if is_personnalise
        else None,
        desactive=is_desactive,
        renseigne=True
    )


def update_action_score_from_children_scores(
        point_tree_referentiel: ActionPointTree,
        point_tree_personnalise: ActionPointTree,
        scores: Dict[ActionId, ActionScore],
        potentiels: Dict[ActionId, float],
        action_personnalise_ids: List[ActionId],
        action_desactive_ids: List[ActionId],
        action_id: ActionId,
):
    action_children = point_tree_referentiel.get_children(action_id)
    action_point_referentiel = point_tree_referentiel.get_action_point(action_id)
    action_point_personnalise = point_tree_personnalise.get_action_point(action_id)

    point_pas_fait = sum(
        [scores[child_id].point_pas_fait for child_id in action_children]
    )

    point_fait = sum(
        [scores[child_id].point_fait for child_id in action_children]
    )

    point_programme = sum(
        [scores[child_id].point_programme for child_id in action_children]
    )
    point_non_renseigne = sum(
        [
            scores[child_id].point_non_renseigne
            for child_id in action_children
        ]
    )
    point_potentiel = potentiels[action_id]
    concerne = (
        any([scores[child_id].concerne for child_id in action_children])
        if action_children
        else True
    )
    is_personnalise = action_id in action_personnalise_ids
    is_desactive = action_id in action_desactive_ids

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
                for child_id in action_children
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
                for child_id in action_children
            ]
        ),
        programme_taches_avancement=sum(
            [
                scores[child_id].programme_taches_avancement
                for child_id in action_children
            ]
        ),
        pas_fait_taches_avancement=sum(
            [
                scores[child_id].pas_fait_taches_avancement
                for child_id in action_children
            ]
        ),
        pas_concerne_taches_avancement=sum(
            [
                scores[child_id].pas_concerne_taches_avancement
                for child_id in action_children
            ]
        ),
        point_referentiel=action_point_referentiel,
        concerne=concerne,
        # perso
        point_potentiel_perso=action_point_personnalise
        if is_personnalise and not is_desactive
        else None,
        desactive=is_desactive,
        renseigne=True
    )


def _propagate_non_concerne(
        point_tree: ActionPointTree,
        action_id: ActionId,
        action_concerne_ids: List[ActionId],
        action_non_concerne_ids: List[ActionId],
):
    if action_id in action_non_concerne_ids:
        return
    if action_id in action_concerne_ids:
        return
    children = point_tree.get_children(action_id)
    if children and all([child in action_non_concerne_ids for child in children]):
        action_non_concerne_ids.append(action_id)


@timeit("compute_action_non_concerne_ids")
def compute_action_non_concerne_ids(
        point_tree: ActionPointTree,
        statuts: List[ActionStatut],
        action_desactive_ids: List[ActionId]
):
    action_concerne_ids = [
        action_status.action_id
        for action_status in statuts
        if action_status.concerne
    ]

    action_non_concerne_ids = [
        action_status.action_id
        for action_status in statuts
        if not action_status.concerne
    ]

    action_non_concerne_ids += action_desactive_ids

    """Quand tous les enfants sont non concernés, propage le statut vers le parent"""
    point_tree.map_from_taches_to_root(
        lambda action_id: _propagate_non_concerne(
            point_tree,
            action_id,
            action_concerne_ids,
            action_non_concerne_ids,
        )
    )

    return action_non_concerne_ids


@timeit("compute_actions_desactivees_ids")
def compute_action_desactive_ids(
        point_tree_personnalise: ActionPointTree,
        personnalisation_consequences: dict[ActionId, ActionPersonnalisationConsequence]
) -> List[ActionId]:
    """Propage la désactivation des parents aux enfants."""
    desactivations = [
        action_id
        for action_id, consequence in personnalisation_consequences.items()
        if consequence.desactive
    ]
    action_desactive_ids = set()
    for action_id in desactivations:
        point_tree_personnalise.map_from_action_to_taches(
            lambda child_id: action_desactive_ids.add(child_id),
            action_id,
        )
    return list(action_desactive_ids)


def _action_potentiel_with_redistribution_remainder(
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
            additional_potentiel = points_non_concerne_to_redistribute / len(actions_to_redistribute_amongst)
            return original_action_potentiel + additional_potentiel
    return original_action_potentiel


@timeit("compute_potentiels")
def compute_potentiels(
        point_tree_personnalise: ActionPointTree,
        statuts: List[ActionStatut],
        action_non_concerne_ids: List[ActionId],
        action_level: int,
) -> Dict[ActionId, float]:
    potentiels = {}

    action_concerne_ids = [
        action_status.action_id
        for action_status in statuts
        if action_status.concerne
    ]

    def _add_action_potentiel_after_redistribution(
            action_id: ActionId,
    ):
        this_level = point_tree_personnalise.depths[action_id]
        children = point_tree_personnalise.get_children(action_id)

        if action_id in action_non_concerne_ids:  # non-concerné
            potentiel = 0
        elif action_id in action_concerne_ids:  # action avec un statut
            potentiel = point_tree_personnalise.get_action_point(action_id)
        elif not children:  # tache
            potentiel = point_tree_personnalise.get_action_point(action_id)
        else:
            potentiel = sum(
                [
                    potentiels[child_id]
                    for child_id in point_tree_personnalise.get_children(action_id)
                ]
            )

        if this_level > action_level:
            potentiel = _action_potentiel_with_redistribution_remainder(
                action_id,
                potentiel,
                action_non_concerne_ids,
                point_tree_personnalise,
            )

        potentiels[action_id] = potentiel

    point_tree_personnalise.map_from_taches_to_root(
        lambda action_id: _add_action_potentiel_after_redistribution(
            action_id,
        )
    )

    def _resize_children_potentiels(action_id: ActionId):
        """Ajuste les potentiels des enfants d'une action"""
        action_potentiel = potentiels[action_id]
        action_referentiel_points = point_tree_personnalise.get_action_point(action_id)

        # Si un potentiel a été modifié
        if action_potentiel != action_referentiel_points:
            children = point_tree_personnalise.get_children(action_id)
            if not children:
                return

            # pour chaque enfant
            for child_id in children:
                # on ajuste son potentiel avec le même facteur de potentiel que son parent
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

    # On ajuste les potentiels des enfants en partant du niveau de l'action
    # - les points des actions n'étant pas redistribués.
    point_tree_personnalise.map_from_actions_to_taches(
        lambda action_id: _resize_children_potentiels(
            action_id,
        ),
        action_level,
    )
    return potentiels


@timeit("build_point_tree_personnalise")
def build_point_personnalisation_tree(
        referentiel_tree: ActionPointTree,
        personnalisation_consequences: Dict[ActionId, ActionPersonnalisationConsequence],
) -> ActionPointTree:
    """Applique les potentiels personnalisés sur une copie de l'arbre du référentiel."""
    personnalise_tree = referentiel_tree.clone()
    for action_id, consequence in personnalisation_consequences.items():
        if consequence.potentiel_perso is not None:
            factor = float(consequence.potentiel_perso)
            personnalisation = (
                lambda action_id: personnalise_tree.set_action_point(
                    action_id,
                    personnalise_tree.get_action_point(action_id) * factor,
                    )
            )
            personnalise_tree.map_from_action_to_taches(
                personnalisation,
                action_id,
            )
    return personnalise_tree
