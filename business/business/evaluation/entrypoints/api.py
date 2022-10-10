from dataclasses import dataclass
from fastapi import FastAPI

from business.evaluation.domain.use_cases.compute_referentiel_scores_for_collectivite import (
    ActionPointTree,
    compute_scores,
)
from business.utils.models.actions import (
    ActionChildren,
    ActionComputedPoint,
    ActionId,
)
from business.utils.models.action_statut import ActionStatut
from business.utils.models.personnalisation import ActionPersonnalisationConsequence
from business.utils.models.action_score import ActionScore

app = FastAPI()


@dataclass
class EvaluationReferentiel:
    children: list[ActionChildren]
    computed_points: list[ActionComputedPoint]
    action_level: int


@dataclass
class EvaluatePayload:
    statuts: list[ActionStatut]
    consequences: dict[ActionId, ActionPersonnalisationConsequence]
    evaluation_referentiel: EvaluationReferentiel


@app.post("/evaluate/")
async def evaluate(payload: EvaluatePayload) -> list[ActionScore]:
    # TODO : cache this tree ?
    point_tree_referentiel = ActionPointTree(
        payload.evaluation_referentiel.computed_points,
        payload.evaluation_referentiel.children,
    )
    scores = compute_scores(
        point_tree_referentiel,
        payload.statuts,
        payload.consequences,
        payload.evaluation_referentiel.action_level,
    )
    return scores
