from copy import copy
from typing import Dict, List

from business.utils.models.action_statut import (
    ActionStatut,
)
from business.utils.models.action_score import ActionScore
from .action_point_tree import ActionPointTree, ActionTree
from business.utils.models.actions import ActionId
from business.utils.models.personnalisation import ActionPersonnalisationConsequence
from business.evaluation.personnalisation.execute_score_personnalisation_factor_regle import (
    execute_score_personnalisation_override_regle,
)
from .compute_scores_utils import *


def compute_scores(
        referentiel_tree: ActionPointTree,
        statuses: List[ActionStatut],
        personnalisation_consequences: dict[ActionId, ActionPersonnalisationConsequence],
        action_level: int,
) -> Dict[ActionId, ActionScore]:
    # 0. Construit l'arbre personnalisé en appliquant la pondération due aux conséquences.
    personnalise_tree = build_point_personnalisation_tree(
        referentiel_tree, personnalisation_consequences
    )

    # 1. Première passe, calcule la redistribution des potentiels des actions désactivés ou non concernées
    action_desactive_ids = compute_actions_desactivees_ids(
        personnalise_tree,
        personnalisation_consequences,
    )

    action_non_concerne_ids = (
            compute_actions_non_concernes_ids(personnalise_tree, statuses)
            + action_desactive_ids
    )

    potentiels = compute_potentiels(
        personnalise_tree,
        action_non_concerne_ids,
        action_level,
    )

    # 2. Estimate tache points based on statuses
    action_personnalises_ids = list(personnalisation_consequences.keys())

    status_by_action_id: Dict[str, ActionStatut] = {
        action_status.action_id: action_status
        for action_status in statuses
        if action_status.is_renseigne
    }

    scores: Dict[ActionId, ActionScore] = {}

    referentiel_tree.map_on_taches(
        lambda tache: update_scores_from_tache_given_statuses(
            referentiel_tree,
            personnalise_tree,
            scores,
            potentiels,
            tache,
            status_by_action_id,
            action_non_concerne_ids,
            action_personnalises_ids,
            action_desactive_ids,
        )
    )
    # 3. Infer all action points based on their children's
    referentiel_tree.map_from_sous_actions_to_root(
        lambda action_id: update_scores_for_action_given_children_scores(
            referentiel_tree,
            personnalise_tree,
            scores,
            potentiels,
            action_personnalises_ids,
            action_desactive_ids,
            action_id,
        )
    )

    # 4. Apply potentiel reduction a posteriori (from formules)
    for (
            action_id,
            personnalisation_consequence,
    ) in personnalisation_consequences.items():
        if (
                personnalisation_consequence.score_formule is not None
                and scores[action_id].point_potentiel
                != 0.0  # if point_potentiel equals 0., no worthy reduction
        ):
            original_score = (
                    scores[action_id].point_fait / scores[action_id].point_potentiel
            )
            overriden_score = execute_score_personnalisation_override_regle(
                personnalisation_consequence.score_formule, scores
            )
            if overriden_score is not None and original_score > 0:
                override_factor = overriden_score / original_score
                referentiel_tree.map_from_action_to_taches(
                    lambda action_id: apply_factor_to_score_realise(scores, action_id, override_factor),  # type: ignore
                    action_id,
                    include_action=True,
                )
                referentiel_tree.map_from_action_to_root(
                    lambda action_id: set_points_to_children_sum(
                        scores, action_id, referentiel_tree
                    ),
                    action_id,
                    include_action=False,
                )
    return {
        action_id: _round_action_score(score) for action_id, score in scores.items()
    }


def apply_factor_to_score_realise(
        scores: Dict[ActionId, ActionScore], action_id: ActionId, factor: float
):
    scores[action_id].point_fait *= factor


def set_points_to_children_sum(
        scores: Dict[ActionId, ActionScore], action_id: ActionId, tree: ActionTree
):
    children = tree.get_children(action_id)
    children_scores = [scores[child_id] for child_id in children]  # type: ignore
    point_potentiel_perso = sum(
        [
            child.point_potentiel_perso or child.point_potentiel
            for child in children_scores
        ]
    )
    scores[action_id].point_potentiel_perso = point_potentiel_perso
    scores[action_id].point_potentiel = point_potentiel_perso
    scores[action_id].point_fait = sum([child.point_fait for child in children_scores])
    scores[action_id].point_non_renseigne = sum(
        [child.point_non_renseigne for child in children_scores]
    )
    scores[action_id].point_pas_fait = sum(
        [child.point_pas_fait for child in children_scores]
    )
    scores[action_id].point_programme = sum(
        [child.point_programme for child in children_scores]
    )


def _round_action_score(action_score: ActionScore, ndigits=3) -> ActionScore:
    action_score = copy(action_score)
    action_score.point_potentiel = round(action_score.point_potentiel, ndigits)
    action_score.point_fait = round(action_score.point_fait, ndigits)
    action_score.point_programme = round(action_score.point_programme, ndigits)
    action_score.point_non_renseigne = round(action_score.point_non_renseigne, ndigits)
    action_score.point_pas_fait = round(action_score.point_pas_fait, ndigits)
    action_score.point_referentiel = round(action_score.point_referentiel, ndigits)
    if action_score.point_potentiel_perso:
        action_score.point_potentiel_perso = round(
            action_score.point_potentiel_perso, ndigits
        )
    return action_score
