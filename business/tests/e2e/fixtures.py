from dataclasses import asdict
from typing import Callable, Dict, List
import pytest
import json
from fastapi.testclient import TestClient

from business.evaluation.api import EvaluationReferentiel, app, PersonnalizePayload
from business.utils.models.actions import (
    ActionComputedPoint,
    ActionDefinition,
    ActionId,
    ActionReferentiel,
)
from business.utils.models.identite import IdentiteCollectivite
from business.utils.models.personnalisation import (
    ActionPersonnalisationRegles,
)
from business.evaluation.personnalisation.regles_parser import ReglesParser
from business.utils.models.action_statut import ActionStatut
from business.utils.models.personnalisation import ActionPersonnalisationConsequence
from business.utils.models.action_score import ActionScore
from business.utils.models.reponse import Reponse
from business.evaluation.api import (
    EvaluatePayload,
)


@pytest.fixture
def execution_api():
    return TestClient(app)


@pytest.fixture
def eci_evaluation_ref() -> EvaluationReferentiel:
    # importe les données eci du json
    with open("./tests/data/dl_content/eci.json", "r") as f:
        action_eci = json.load(f)

    # construit EvaluationReferentiel depuis les données
    children = action_eci["children"]
    computed_points = [
        ActionComputedPoint.from_definition(ActionDefinition(**definition))
        for definition in action_eci["definitions"]
    ]
    eci_action_level = 2
    return EvaluationReferentiel(children, computed_points, eci_action_level)


@pytest.fixture
def cae_evaluation_ref() -> EvaluationReferentiel:
    # importe les données cae du json
    with open("./tests/data/dl_content/cae.json", "r") as f:
        action_cae = json.load(f)

    # construit EvaluationReferentiel depuis les données
    children = action_cae["children"]
    computed_points = [
        ActionComputedPoint.from_definition(ActionDefinition(**definition))
        for definition in action_cae["definitions"]
    ]
    cae_action_level = 3
    return EvaluationReferentiel(children, computed_points, cae_action_level)


@pytest.fixture
def regles() -> list[ActionPersonnalisationRegles]:
    # importe les données de personnalisation du json
    with open("./tests/data/dl_content/personnalisations.json", "r") as f:
        personnalisation = json.load(f)
    return [
        ActionPersonnalisationRegles.from_dict(regle)
        for regle in personnalisation["regles"]
    ]


@pytest.fixture
def regles_parser(regles) -> ReglesParser:
    return ReglesParser(regles)


@pytest.fixture()
def test_post_evaluate(
    execution_api, eci_evaluation_ref, cae_evaluation_ref
) -> Callable[
    [ActionReferentiel, List[ActionStatut], List[ActionPersonnalisationConsequence]],
    Dict[ActionId, ActionScore],
]:
    def post_evaluate(
        referentiel: ActionReferentiel,
        statuts: list[ActionStatut] = None,
        consequences: list[ActionPersonnalisationConsequence] = None,
    ):
        # construit le payload avec des statuts et consequences
        evaluation_ref = (
            eci_evaluation_ref if referentiel == "eci" else cae_evaluation_ref
        )
        payload = EvaluatePayload(statuts or [], consequences or [], evaluation_ref)
        response = execution_api.post(
            "/evaluate/",
            headers={"X-Token": "coneofsilence"},
            json=asdict(payload),
        )
        # vérifie que l'api retourne les bons scores
        assert response.status_code == 200
        scores = {
            action_id: ActionScore(**score_as_dict)
            for action_id, score_as_dict in response.json().items()
        }
        return scores

    return post_evaluate


@pytest.fixture()
def test_post_personnalize(
    execution_api, regles
) -> Callable[
    [list[Reponse], IdentiteCollectivite],
    Dict[ActionId, ActionPersonnalisationConsequence],
]:
    def post_personnalize(
        reponses: list[Reponse] = None,
        identite: IdentiteCollectivite = None,
    ):
        payload = PersonnalizePayload(
            regles, reponses or [], identite or IdentiteCollectivite()
        )
        response = execution_api.post(
            "/personnalize/",
            headers={"X-Token": "coneofsilence"},
            json=payload.asdict(),
        )

        # vérifie que l'api retourne les bons scores
        assert response.status_code == 200
        actual_response = response.json()

        return {
            action_id: ActionPersonnalisationConsequence(**consequence)
            for action_id, consequence in actual_response.items()
        }

    return post_personnalize
