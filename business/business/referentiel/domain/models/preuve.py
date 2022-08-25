from dataclasses import dataclass
from typing import NewType

from business.utils.action_id import ActionId

PreuveId = NewType("PreuveId", str)


@dataclass
class Preuve:
    id: PreuveId
    nom: str
    action_id: ActionId
    description: str = ""
