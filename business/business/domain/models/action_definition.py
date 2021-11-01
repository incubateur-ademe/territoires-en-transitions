from typing import Optional

from dataclasses import dataclass

from business.domain.models.litterals import ReferentielId
from business.utils.action_id import ActionId


@dataclass
class ActionDefinition:
    action_id: ActionId
    referentiel_id: ReferentielId
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
    referentiel_id: ReferentielId
    action_id: ActionId
