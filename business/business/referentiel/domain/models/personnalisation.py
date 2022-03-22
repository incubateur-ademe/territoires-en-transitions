from dataclasses import dataclass
from typing import List, Literal

from business.utils.action_id import ActionId

RegleType = Literal["score", "desactivation", "reduction"]


@dataclass
class Regle:
    formule: str
    type: RegleType
    description: str = ""


@dataclass
class ActionPersonnalisation:
    action_id: ActionId
    titre: str
    regles: List[Regle]
    description: str = ""

    @classmethod
    def from_dict(cls, d: dict) -> "ActionPersonnalisation":
        return cls(
            action_id=d["action_id"],
            description=d["description"],
            titre=d["titre"],
            regles=[Regle(**regle) for regle in d["regles"]],
        )
