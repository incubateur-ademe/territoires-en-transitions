from dataclasses import dataclass

from business.domain.models.action_definition import ActionId
from business.domain.models.litterals import Referentiel


@dataclass
class ActionPoints:
    referentiel: Referentiel
    action_id: ActionId
    value: float
