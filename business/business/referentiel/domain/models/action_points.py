from dataclasses import dataclass

from business.utils.action_id import ActionId
from business.core.domain.models.referentiel import Referentiel


@dataclass
class ActionPoints:
    referentiel: Referentiel
    action_id: ActionId
    value: float
