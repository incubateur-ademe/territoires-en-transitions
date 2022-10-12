from dataclasses import asdict

from business.evaluation.api import (
    PersonnalizePayload,
)
from business.utils.models.identite import IdentiteCollectivite
from .fixtures import *


def test_personnalize_eci(execution_api, regles):
    reponses = []
    identite = IdentiteCollectivite()
    payload = PersonnalizePayload(regles, reponses, identite)
    response = execution_api.post(
        "/personnalize/",
        headers={"X-Token": "coneofsilence"},
        json=payload.asdict(),
    )

    # vérifie que l'api retourne les bons scores
    assert response.status_code == 200
    actual_response = response.json()
    assert len(regles) == len(actual_response)
