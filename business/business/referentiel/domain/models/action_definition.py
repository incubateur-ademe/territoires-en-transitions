from typing import Optional

from dataclasses import dataclass

from business.core.domain.models.referentiel import ActionReferentiel
from business.utils.action_id import ActionId


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
    points: Optional[float]
    pourcentage: Optional[float]


@dataclass
class ReferentielActionId:
    referentiel: ActionReferentiel
    action_id: ActionId
