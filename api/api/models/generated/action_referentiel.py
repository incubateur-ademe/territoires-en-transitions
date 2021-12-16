from __future__ import annotations

from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel


class ActionReferentiel(BaseModel):
    id: str
    id_nomenclature: str
    nom: str
    thematique_id: str
    description: Optional[str]
    contexte: Optional[str]
    exemples: Optional[str]
    ressources: Optional[str]
    preuve: Optional[str]
    points: float
    actions: List[ActionReferentiel]
