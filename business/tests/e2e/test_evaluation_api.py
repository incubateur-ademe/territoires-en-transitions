from dataclasses import asdict

from business.evaluation.api import (
    EvaluatePayload,
)
from .fixtures import *


def test_evaluate_eci(execution_api, eci_evaluation_ref):
    # construit le payload avec des statuts et consequences
    statuts = []
    consequences = {}
    payload = EvaluatePayload(statuts, consequences, eci_evaluation_ref)
    response = execution_api.post(
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


def test_evaluate_cae(execution_api, cae_evaluation_ref):
    # construit le payload avec des statuts et consequences
    statuts = []
    consequences = {}
    payload = EvaluatePayload(statuts, consequences, cae_evaluation_ref)
    response = execution_api.post(
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
