from __future__ import annotations
from api.models.generated.action_status import ActionStatusAvancement

from datetime import date
from typing import List, Literal
from pydantic import BaseModel
from dataclasses import dataclass


@dataclass
class ActionReferentielScore:
    action_id: str
    action_nomenclature_id: str
    avancement: ActionStatusAvancement
    points: float
    percentage: float
    potentiel: float
    referentiel_points: float
    referentiel_percentage: float
