from dataclasses import dataclass
from enum import Enum

from typing import Any

from typing import Optional

from business.utils.action_id import ActionId


@dataclass
class DetailedAvancement:
    fait: float
    programme: float
    pas_fait: float


@dataclass
class ActionStatut:
    action_id: ActionId
    detailed_avancement: Optional[DetailedAvancement]
    concerne: "bool"

    @property
    def is_renseigne(self) -> bool:
        return self.detailed_avancement is not None
