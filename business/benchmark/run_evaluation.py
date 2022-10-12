import json
import time
from typing import List, Dict

from business.evaluation.adapters.supabase_action_statut_repo import (
    SupabaseActionStatutRepository,
)
from business.utils.models.action_statut import ActionStatut
from business.evaluation.domain.evaluation import (
    ActionPointTree,
    compute_referentiel_scores_for_collectivite,
)
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
            for row in data
            if row["referentiel"] == referentiel
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
            for row in data
            if str.startswith(row["action_id"], referentiel)
        ]


def action_point_tree(referentiel: str):
    children = all_children_from_referentiel(referentiel)
    points = all_points_from_referentiel(referentiel)
    return ActionPointTree(points, children)


def action_statuts(referentiel: str) -> List[ActionStatut]:
    with open("./benchmark/action_statut.json", "r") as read_file:
        data = json.load(read_file)
        return [
            SupabaseActionStatutRepository.action_statut_from_row(row)
            for row in data
            if str.startswith(row["action_id"], referentiel)
        ]


def action_consequences(
    referentiel: str,
) -> Dict[ActionId, ActionPersonnalisationConsequence]:
    with open("./benchmark/consequences.json", "r") as read_file:
        data = json.load(read_file)
        return {
            action_id: ActionPersonnalisationConsequence(**consequence)
            for action_id, consequence in data.items()
            if str.startswith(action_id, referentiel)
        }


def run(referentiel: str, action_level: int, times: int):
    tree = action_point_tree(referentiel)
    statuts = action_statuts(referentiel)
    consequences = action_consequences(referentiel)

    personnalisation_consequences = {
        action_id: personnalisation_consequence
        for (
            action_id,
            personnalisation_consequence,
        ) in consequences.items()
        if action_id in tree.backward_ids
    }

    for _ in range(times):
        compute_referentiel_scores_for_collectivite(
            tree,
            statuts,
            personnalisation_consequences,
            action_level,
            referentiel,
        )


def run_cae(times: int):
    run("cae", 3, times)


def run_eci(times: int):
    run("eci", 2, times)


if __name__ == "__main__":
    times = 100
    cae_start = time.time()
    run_cae(times)
    cae_end = time.time()

    eci_start = time.time()
    run_eci(times)
    eci_end = time.time()

    print("CAE: %2.2f ms" % ((cae_end - cae_start) * 1000 / times))
    print("ECI: %2.2f ms" % ((eci_end - eci_start) * 1000 / times))
