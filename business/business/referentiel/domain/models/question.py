from dataclasses import dataclass
from typing import List, Optional
from typing import Literal

from business.utils.action_id import ActionId


@dataclass
class Choix:
    id: str
    formulation: str


@dataclass
class Question:
    id: str
    formulation: str
    description: str
    action_ids: List[ActionId]
    type: Literal["choix", "binaire", "proportion"]
    choix: Optional[List[Choix]] = None
