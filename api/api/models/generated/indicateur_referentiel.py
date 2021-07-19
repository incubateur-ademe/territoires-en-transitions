from __future__ import annotations

from datetime import date
from typing import List, Literal
from pydantic import BaseModel


class IndicateurReferentiel(BaseModel):
    id: str
    action_ids: List[str]
    nom: str
    description: str
    thematique_id: str
    unite: str
