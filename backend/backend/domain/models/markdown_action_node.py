from __future__ import annotations
from pydantic.main import BaseModel

from typing import List, Optional


class MarkdownActionNode(BaseModel):
    identifiant: str
    nom: str
    thematique_id: str = ""
    description: str = ""
    contexte: str = ""
    exemples: str = ""
    ressources: str = ""
    points: Optional[float] = None
    percentage: Optional[float] = None
    actions: List[MarkdownActionNode] = []


MarkdownActionNode.update_forward_refs()
