from __future__ import annotations
from typing import List, Optional

from pydantic.main import BaseModel
from business.domain.models.litterals import ReferentielId


class MarkdownActionNode(BaseModel):
    identifiant: str
    nom: str
    thematique_id: str = ""
    description: str = ""
    contexte: str = ""
    exemples: str = ""
    ressources: str = ""
    referentiel_id: Optional[ReferentielId] = None
    points: Optional[float] = None
    percentage: Optional[float] = None
    actions: List[MarkdownActionNode] = []


MarkdownActionNode.update_forward_refs()
