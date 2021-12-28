from dataclasses import dataclass
from typing import Optional
from business.utils.action_id import ActionId


@dataclass
class ActionScore:
    action_id: ActionId  # eg.  "eci_1.0"
    points: Optional[float]
    previsionnel: Optional[float]
    potentiel: float
    referentiel_points: float
    concerne: bool
    total_taches_count: int
    completed_taches_count: int
