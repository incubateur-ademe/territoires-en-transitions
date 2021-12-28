from __future__ import annotations
from typing import List, Optional

from pydantic.main import BaseModel
from business.core.domain.models.referentiel import ActionReferentiel


class MarkdownActionNode(BaseModel):
    identifiant: str
    nom: str
    thematique_id: str = ""
    description: str = ""
    contexte: str = ""
    exemples: str = ""
    ressources: str = ""
    referentiel: Optional[ActionReferentiel] = None
    points: Optional[float] = None
    pourcentage: Optional[float] = None
    actions: List[MarkdownActionNode] = []


MarkdownActionNode.update_forward_refs()
