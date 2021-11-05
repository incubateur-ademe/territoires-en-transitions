from __future__ import annotations
from typing import List, Optional

from pydantic.main import BaseModel
from business.domain.models.litterals import Referentiel


class MarkdownActionNode(BaseModel):
    identifiant: str
    nom: str
    thematique_id: str = ""
    description: str = ""
    contexte: str = ""
    exemples: str = ""
    ressources: str = ""
    referentiel: Optional[Referentiel] = None
    points: Optional[float] = None
    pourcentage: Optional[float] = None
    actions: List[MarkdownActionNode] = []


MarkdownActionNode.update_forward_refs()
