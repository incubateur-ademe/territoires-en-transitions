from __future__ import annotations
from pydantic.main import BaseModel

from typing import List, Optional
from backend.domain.models.action_definition import ActionId
from backend.domain.models.litterals import ReferentielId


class MarkdownActionNode(BaseModel):
    identifiant: str  # TODO? Should it be a tuple?
    nom: str
    thematique_id: str = ""
    description: str = ""
    contexte: str = ""
    exemples: str = ""
    ressources: str = ""
    points: Optional[float] = None
    percentage: Optional[float] = None
    actions: List[MarkdownActionNode] = []

    # @property
    # def action_id(self):
    #     return ActionId(f"{self.referentiel_id}_{self.identifiant}")


MarkdownActionNode.update_forward_refs()
