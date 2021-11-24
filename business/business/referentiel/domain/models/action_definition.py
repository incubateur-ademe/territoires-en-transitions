from typing import Optional

from dataclasses import dataclass

from business.core.domain.models.referentiel import Referentiel
from business.utils.action_id import ActionId


@dataclass
class ActionDefinition:
    action_id: ActionId
    referentiel: Referentiel
    identifiant: str
    nom: str
    thematique_id: str
    description: str
    contexte: str
    exemples: str
    ressources: str
    points: Optional[float]
    pourcentage: Optional[float]


@dataclass
class ReferentielActionId:
    referentiel: Referentiel
    action_id: ActionId
