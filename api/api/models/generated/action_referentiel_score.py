from __future__ import annotations

from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel


class ActionReferentielScore(BaseModel):
    action_id: str
    action_nomenclature_id: str
    avancement: Literal["faite", "programmee", "pas_faite", "non_concernee", ""]
    points: float
    percentage: float
    potentiel: float
    referentiel_points: float
    referentiel_percentage: float
