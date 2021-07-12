from __future__ import annotations

from datetime import date
from typing import List
from pydantic import BaseModel


class ActionReferentielScore(BaseModel):
    action_id: str
    action_nomenclature_id: str
    status: str
    points: float
    percentage: float
    potentiel: float
    referentiel_points: float
    referentiel_percentage: float
