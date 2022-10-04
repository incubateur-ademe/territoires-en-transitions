from dataclasses import dataclass
from typing import List, Literal

from .actions import ActionId

RegleType = Literal["score", "desactivation", "reduction"]


@dataclass
class Regle:
    """Regle de personnalisation"""

    formule: str
    type: RegleType
    description: str = ""


@dataclass
class ActionRegles:
    """Regles de personnalisation pour une action"""

    action_id: ActionId
    regles: List[Regle]
    titre: str = ""
    description: str = ""

    @classmethod
    def from_dict(cls, d: dict) -> "ActionRegles":
        return cls(
            action_id=d["action_id"],
            description=d["description"],
            titre=d["titre"],
            regles=[Regle(**regle) for regle in d["regles"]],
        )
