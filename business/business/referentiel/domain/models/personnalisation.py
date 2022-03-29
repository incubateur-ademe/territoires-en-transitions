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
class ActionPersonnalisationRegles:
    """Regles de personnalisation pour une action, comme définie dans les markdowns, contenant une liste de regles (une seule par type !)"""

    action_id: ActionId
    regles: List[Regle]
    titre: str = ""
    description: str = ""

    @classmethod
    def from_dict(cls, d: dict) -> "ActionPersonnalisationRegles":
        return cls(
            action_id=d["action_id"],
            description=d["description"],
            titre=d["titre"],
            regles=[Regle(**regle) for regle in d["regles"]],
        )
