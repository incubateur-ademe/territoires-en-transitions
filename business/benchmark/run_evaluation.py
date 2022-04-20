import json
from typing import List, Dict

from business.evaluation.adapters.supabase_action_statut_repo import SupabaseActionStatutRepository
from business.evaluation.domain.models.action_statut import ActionStatut
from business.evaluation.domain.use_cases import ActionPointTree, compute_scores
from business.personnalisation.models import ActionPersonnalisationConsequence
from business.referentiel.domain.models.action_children import ActionChildren
from business.referentiel.domain.models.action_computed_point import ActionComputedPoint
from business.utils.action_id import ActionId


def all_children_from_referentiel(referentiel: str):
    with open("./benchmark/business_action_children.json", "r") as read_file:
        data = json.load(read_file)
        return [
            ActionChildren(
                referentiel=row["referentiel"],
                action_id=row["id"],
                children=row["children"] or [],
            )
            for row in data if row['referentiel'] == referentiel
        ]


def all_points_from_referentiel(referentiel: str) -> List[ActionComputedPoint]:
    with open("./benchmark/computed_points.json", "r") as read_file:
        data = json.load(read_file)
        return [
            ActionComputedPoint(
                referentiel=referentiel,
                action_id=row["action_id"],
                value=row["value"],
            )
            for row in data if str.startswith(row['action_id'], referentiel)
        ]


def action_point_tree(referentiel):
    children = all_children_from_referentiel(referentiel)
    points = all_points_from_referentiel(referentiel)
    return ActionPointTree(points, children)


def action_statuts() -> List[ActionStatut]:
    with open("./benchmark/action_statut.json", "r") as read_file:
        data = json.load(read_file)
        return [
            SupabaseActionStatutRepository.action_statut_from_row(row)
            for row in data if str.startswith(row['action_id'], referentiel)
        ]


def action_consequences() -> Dict[ActionId, ActionPersonnalisationConsequence]:
    with open("./benchmark/consequences.json", "r") as read_file:
        data = json.load(read_file)
        return {
            action_id: ActionPersonnalisationConsequence(**consequence)
            for action_id, consequence in data.items() if str.startswith(action_id, referentiel)
        }


if __name__ == '__main__':
    referentiel = 'cae'
    action_level = 3

    tree = action_point_tree(referentiel)
    statuts = action_statuts()
    consequences = action_consequences()

    personnalisation_consequences = {
        action_id: personnalisation_consequence
        for (
            action_id,
            personnalisation_consequence,
        ) in consequences.items()
        if action_id in tree.backward_ids
    }

    for _ in range(100):
        scores = compute_scores(
            tree,
            statuts,
            personnalisation_consequences,
            action_level,
            referentiel,
        )
