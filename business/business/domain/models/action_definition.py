from typing import Optional

from dataclasses import dataclass

from business.domain.models.litterals import ReferentielId, ActionId


@dataclass
class ActionDefinition:
    action_id: ActionId
    referentiel_id: ReferentielId
    identifiant: str  # TODO: Should it be a tuple?
    nom: str
    thematique_id: str
    description: str
    contexte: str
    exemples: str
    ressources: str
    points: Optional[float]
    percentage: Optional[float]
