from dataclasses import dataclass
from typing import Literal


@dataclass
class CollectiviteActivationEvent:
    collectivite_id: int
    created_at: str
    id: int
