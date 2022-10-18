from dataclasses import asdict, dataclass
from fastapi import APIRouter

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
async def personnalize(payload: PersonnalizePayload) -> dict[ActionId, ActionPersonnalisationConsequence]:
    regles_parser = ReglesParser(payload.regles)
    consequences = execute_personnalisation_regles(
        regles_parser,
        payload.reponses,
        payload.identite,
    )
    return consequences
