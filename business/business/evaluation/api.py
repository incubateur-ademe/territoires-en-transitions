from dataclasses import asdict, dataclass
import json
import os
from fastapi import APIRouter
import requests
import asyncio

from business.evaluation.evaluation.compute_scores import (
    ActionPointTree,
    compute_scores,
)
from business.evaluation.personnalisation.execute_personnalisation_regles import (
    execute_personnalisation_regles,
)
from business.evaluation.personnalisation.regles_parser import ReglesParser
from business.utils.models.actions import (
    ActionChildren,
    ActionComputedPoint,
    ActionId,
    ActionReferentiel,
)
from business.utils.models.action_statut import ActionStatut
from business.utils.models.identite import IdentiteCollectivite
from business.utils.models.personnalisation import ActionPersonnalisationConsequence
from business.utils.models.action_score import ActionScore
from business.utils.models.personnalisation import ActionPersonnalisationRegles
from business.utils.models.reponse import Reponse

router = APIRouter()


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


@router.post("/evaluation/")
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
    return list(scores.values())


@dataclass
class PersonnalizePayload:
    regles: list[ActionPersonnalisationRegles]
    reponses: list[Reponse]
    identite: IdentiteCollectivite

    def asdict(self):
        return {
            "regles": [asdict(regle) for regle in self.regles],
            "reponses": [asdict(reponse) for reponse in self.reponses],
            "identite": self.identite.asdict(),
        }


@router.post("/personnalisation/")
async def personnalize(
        payload: PersonnalizePayload,
) -> dict[ActionId, ActionPersonnalisationConsequence]:
    regles_parser = ReglesParser(payload.regles)
    consequences = execute_personnalisation_regles(
        regles_parser,
        payload.reponses,
        payload.identite,
    )
    return consequences


# Endpoints called by the datalayer: return immediately and then post the responses to the right tables
# ---------------------------------
supabase_key = os.environ.get("SUPABASE_KEY")
supabase_perso_url = os.environ.get("SUPABASE_PERSONNALISATION_URL")
supabase_score_url = os.environ.get("SUPABASE_SCORE_URL")


def supabase_headers() -> dict:
    return {"ApiKey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"}


@dataclass
class DatalayerPersonnalisationPayload:
    collectivite_id: int
    payload: PersonnalizePayload


@dataclass
class DatalayerEvaluationPayload:
    collectivite_id: int
    referentiel: ActionReferentiel
    payload: EvaluatePayload


@router.post("/dl_personnalisation/")
def datalayer_personnalisation(payload: DatalayerPersonnalisationPayload):
    asyncio.run(personnalize_then_post_consequences(payload))
    return


@router.post("/dl_evaluation/")
def datalayer_evaluation(payload: DatalayerEvaluationPayload):
    asyncio.run(evaluate_then_post_scores(payload))
    return


async def personnalize_then_post_consequences(
        payload_with_collectivite_id: DatalayerPersonnalisationPayload,
):
    consequences = await personnalize(payload_with_collectivite_id.payload)
    response = requests.post(
        f'{supabase_perso_url}?on_conflict=collectivite_id',
        data=json.dumps(
            {
                "consequences": {
                    action_id: asdict(consequence)
                    for action_id, consequence in consequences.items()
                },
                "collectivite_id": payload_with_collectivite_id.collectivite_id,
            }
        ),
        headers=supabase_headers(),
    )
    print(f'{response.url} replied with a code {response.status_code}')


async def evaluate_then_post_scores(
        payload_with_collectivite_id: DatalayerEvaluationPayload,
):
    scores = await evaluate(payload_with_collectivite_id.payload)
    response = requests.post(
        f'{supabase_score_url}?on_conflict=collectivite_id,referentiel',
        data=json.dumps(
            {
                "scores": [
                    asdict(score) for score in scores
                ],
                "collectivite_id": payload_with_collectivite_id.collectivite_id,
                "referentiel": payload_with_collectivite_id.referentiel,
            }
        ),
        headers=supabase_headers(),
    )
    print(f'{response.url} replied with a code {response.status_code}')
