from __future__ import annotations
from typing import List, Optional

from pydantic.main import BaseModel
from business.referentiel.domain.models.action_definition import (
    ActionCategorie,
)
from business.referentiel.domain.models.referentiel import ActionReferentiel


class MarkdownActionNode(BaseModel):
    identifiant: str
    nom: str
    thematique_id: str = ""
    description: str = ""
    contexte: str = ""
    exemples: str = ""
    ressources: str = ""
    reduction_de_potentiel: str = ""
    perimetre_de_levaluation: str = ""
    referentiel: Optional[ActionReferentiel] = None
    points: Optional[float] = None
    pourcentage: Optional[float] = None
    categorie: Optional[ActionCategorie] = None
    actions: List[MarkdownActionNode] = []


MarkdownActionNode.update_forward_refs()
