from dataclasses import dataclass
from typing import Literal


@dataclass
class ActionStatutUpdateEventRead:
    collectivite_id: int
    referentiel: Literal["eci", "cae"]  # TODO : Should rather be ActionReferentiel ...
    created_at: str
