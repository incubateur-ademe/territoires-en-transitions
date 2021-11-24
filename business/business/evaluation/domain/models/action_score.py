from dataclasses import dataclass
from business.utils.action_id import ActionId


@dataclass
class ActionScore:
    action_id: ActionId  # eg.  "eci_1.0"
    points: float
    potentiel: float
    previsionnel: float
    referentiel_points: float
    concerne: bool
    total_taches_count: int
    completed_taches_count: int
