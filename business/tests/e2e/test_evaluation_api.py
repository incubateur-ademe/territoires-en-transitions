from dataclasses import asdict
import json
from fastapi.testclient import TestClient
import pytest

from business.evaluation.entrypoints.api import (
    EvaluationReferentiel,
    app,
    EvaluatePayload,
)
from business.utils.models.actions import ActionComputedPoint, ActionDefinition


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def eci_evaluation_ref() -> EvaluationReferentiel:
    # importe les données eci du json
    with open("./tests//data/dl_content/eci.json", "r") as f:
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


def test_evaluate_eci(client, eci_evaluation_ref):
    # construit le payload avec des statuts et consequences
    statuts = []
    consequences = {}
    payload = EvaluatePayload(statuts, consequences, eci_evaluation_ref)
    response = client.post(
        "/evaluate/",
        headers={"X-Token": "coneofsilence"},
        json=asdict(payload),
    )

    # vérifie que l'api retourne les bons scores
    assert response.status_code == 200
    actual_response = response.json()
    assert actual_response["eci"] == {
        "action_id": "eci",
        "point_fait": 0.0,
        "point_programme": 0.0,
        "point_pas_fait": 0.0,
        "point_non_renseigne": 500.0,
        "point_potentiel": 500.0,
        "point_referentiel": 500.0,
        "concerne": True,
        "total_taches_count": 274,
        "completed_taches_count": 0,
        "fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "pas_concerne_taches_avancement": 0,
        "desactive": False,
        "point_potentiel_perso": None,
    }


def test_evaluate_cae(client, cae_evaluation_ref):
    # construit le payload avec des statuts et consequences
    statuts = []
    consequences = {}
    payload = EvaluatePayload(statuts, consequences, cae_evaluation_ref)
    response = client.post(
        "/evaluate/",
        headers={"X-Token": "coneofsilence"},
        json=asdict(payload),
    )

    # vérifie que l'api retourne les bons scores
    assert response.status_code == 200
    actual_response = response.json()
    assert actual_response["cae"] == {
        "action_id": "cae",
        "point_fait": 0.0,
        "point_programme": 0.0,
        "point_pas_fait": 0.0,
        "point_non_renseigne": 500.0,
        "point_potentiel": 500.0,
        "point_referentiel": 500.0,
        "concerne": True,
        "total_taches_count": 1111,
        "completed_taches_count": 0,
        "fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "pas_concerne_taches_avancement": 0,
        "desactive": False,
        "point_potentiel_perso": None,
    }
