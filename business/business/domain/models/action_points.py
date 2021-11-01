from dataclasses import dataclass

from business.domain.models.action_definition import ActionId
from business.domain.models.litterals import ReferentielId


@dataclass
class ActionPoints:
    referentiel_id: ReferentielId
    action_id: ActionId
    value: float
