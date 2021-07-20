from __future__ import annotations

from datetime import date
from typing import List, Literal
from pydantic import BaseModel


class ActionReferentiel(BaseModel):
    id: str
    id_nomenclature: str
    nom: str
    description: str
    thematique_id: str
    points: float
    actions: List[ActionReferentiel]


ActionReferentiel.update_forward_refs()
