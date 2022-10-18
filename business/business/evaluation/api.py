from dataclasses import asdict, dataclass
import json
import os
from fastapi import APIRouter
import requests

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


# Endpoints called by the datalayer : return immediately and then post the responses to the right tables
# ---------------------------------
supabase_key = os.environ.get("SUPABASE_KEY")
supabase_perso_url = os.environ.get("SUPABASE_PERSONNALISATION_URL")
supabase_score_url = os.environ.get("SUPABASE_SCORE_URL")


@dataclass
class PersonnalizePayloadWithCollectiviteId:
    collectivite_id: int
    payload: PersonnalizePayload


@router.post("/dl_personnalisation/")
async def dl_personnalize(payload: PersonnalizePayload):
    personnalize_and_save_to_dl(payload)
    return


@router.post("/dl_evaluation/")
async def dl_evaluate(payload: EvaluatePayload):
    evaluate_and_save_to_dl(payload)
    return


async def personnalize_and_save_to_dl(
    payload_with_collectivite_id: PersonnalizePayloadWithCollectiviteId,
):
    consequences = await personnalize(payload_with_collectivite_id.payload)
    requests.post(
        supabase_perso_url,
        data=json.dumps(
            {
                "consequences": consequences,
                "collectivite_id": payload_with_collectivite_id.collectivite_id,
                "referentiel": payload_with_collectivite_id.referentiel,
            }
        ),
        headers={"ApiKey": supabase_key, "Authorization": f"Bearer {supabase_key}"},
    )


@dataclass
class EvaluatePayloadWithCollectiviteIdAndRef:
    collectivite_id: int
    referentiel: ActionReferentiel
    payload: EvaluatePayload


async def evaluate_and_save_to_dl(
    payload_with_collectivite_id: EvaluatePayloadWithCollectiviteIdAndRef,
):
    scores = await evaluate(payload_with_collectivite_id.payload)
    requests.post(
        supabase_score_url,
        data=json.dumps(
            {
                "scores": scores,
                "collectivite_id": payload_with_collectivite_id.collectivite_id,
            }
        ),
        headers={"ApiKey": supabase_key, "Authorization": f"Bearer {supabase_key}"},
    )
