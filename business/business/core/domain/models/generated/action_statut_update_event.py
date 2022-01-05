from dataclasses import dataclass
from typing import Literal


@dataclass
class ActionStatutUpdateEvent:
    collectivite_id: int
    referentiel: Literal["eci", "cae"]
    created_at: str
    id: int
