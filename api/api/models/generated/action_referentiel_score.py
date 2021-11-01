from __future__ import annotations

from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel


class ActionReferentielScore(BaseModel):
    action_id: str
    action_nomenclature_id: str
    avancement: Literal[
        "faite", "programmee", "en_cours", "pas_faite", "non_concernee", ""
    ]
    completion: float
    points: float
    percentage: float
    potentiel: float
    referentiel_points: float
    referentiel_percentage: float
