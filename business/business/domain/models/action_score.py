from typing import Tuple
from dataclasses import dataclass
from business.domain.models.litterals import Referentiel

from business.utils.action_id import ActionId


@dataclass
class ActionScore:
    referentiel: Referentiel  # eg.  "eci_2022"
    action_id: ActionId  # eg.  "eci_1.0"
    points: float
    potentiel: float
    previsionnel: float
    referentiel_points: float
    concernee: bool
    completude_ratio: Tuple[int, int]
