from typing import Optional, Literal

from dataclasses import dataclass

from business.referentiel.domain.models.referentiel import ActionReferentiel
from business.utils.action_id import ActionId


ActionCategorie = Literal["bases", "mise en œuvre", "effets"]


@dataclass
class ActionDefinition:
    action_id: ActionId
    referentiel: ActionReferentiel
    identifiant: str
    nom: str
    description: str
    contexte: str
    exemples: str
    ressources: str
    perimetre_evaluation: str
    reduction_potentiel: str
    points: Optional[float]
    pourcentage: Optional[float]
    categorie: Optional[ActionCategorie]


@dataclass
class ReferentielActionId:
    referentiel: ActionReferentiel
    action_id: ActionId
