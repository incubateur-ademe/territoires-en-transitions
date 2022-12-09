import json
import time
from typing import List, Dict

from business.evaluation.evaluation.action_point_tree import ActionPointTree
from business.evaluation.evaluation.compute_scores import compute_scores
from business.utils.models.action_statut import ActionStatut, DetailedAvancement
from business.utils.models.actions import ActionChildren, ActionComputedPoint, ActionId
from business.utils.models.personnalisation import ActionPersonnalisationConsequence


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
            ActionStatut(action_id=row["action_id"],
                         detailed_avancement=DetailedAvancement(
                             fait=1.0 if row["avancement"] == 'fait' else 0.0,
                             programme=1.0 if row["avancement"] == 'programme' else 0.0,
                             pas_fait=1.0 if row["avancement"] == 'pas_fait' else 0.0,
                         ),
                         concerne=row["concerne"]
                         )
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
        compute_scores(
            tree,
            statuts,
            personnalisation_consequences,
            action_level,
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
