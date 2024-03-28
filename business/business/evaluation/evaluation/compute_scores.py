from copy import copy
from business.evaluation.personnalisation.execute_score_personnalisation_factor_regle import (
    execute_score_personnalisation_override_regle,
)
from .compute_scores_utils import *
from .action_point_tree import ActionTree


def compute_scores(
        referentiel_tree: ActionPointTree,
        statuts: List[ActionStatut],
        personnalisation_consequences: dict[ActionId, ActionPersonnalisationConsequence],
        action_level: int,
) -> Dict[ActionId, ActionScore]:
    # 0. Construit l'arbre personnalisé en appliquant la pondération due aux conséquences.
    personnalise_tree = build_point_personnalisation_tree(
        referentiel_tree, personnalisation_consequences
    )

    # 1. Première passe, calcule la redistribution des potentiels des actions désactivés ou non concernées
    action_desactive_ids = compute_action_desactive_ids(
        personnalise_tree,
        personnalisation_consequences,
    )

    action_non_concerne_ids = compute_action_non_concerne_ids(
        personnalise_tree,
        statuts,
        action_desactive_ids
    )

    # 2. Deuxième et troisième passes, on propage les potentiels
    # - en partant des tâches vers les parents
    # - puis en partant des actions vers les enfants
    potentiels = compute_potentiels(
        personnalise_tree,
        statuts,
        action_non_concerne_ids,
        action_level,
    )

    action_personnalise_ids = list(personnalisation_consequences.keys())
    statuts: Dict[str, ActionStatut] = {
        action_status.action_id: action_status
        for action_status in statuts
        if action_status.is_renseigne
    }

    scores: Dict[ActionId, ActionScore] = {}

    # 3. Quatrième passe Propagation des scores des taches vers les parents
    # - on calcule le score des taches
    # - puis on propage aux parents
    #   - le score de chaque parent est calculé :
    #     - s'il n'a pas de statut : à partir de ses enfants
    #     - s'il a un statut : à partir de lui-même
    referentiel_tree.map_from_taches_to_root(
        lambda action_id: update_action_scores(
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
    )

    # Cinquième pour la fonction de personnalisation scores.
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
                )
                referentiel_tree.map_from_action_to_root(
                    lambda action_id: set_points_to_children_sum(
                        scores, action_id, referentiel_tree
                    ),
                    action_id,
                )

    # Dernière pour passer un tag renseigné
    referentiel_tree.map_from_taches_to_root(
        lambda action_id: add_tag_renseigne(
            referentiel_tree,
            scores,
            action_id
        )
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
