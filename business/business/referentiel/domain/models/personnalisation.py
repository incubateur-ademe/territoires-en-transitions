from dataclasses import dataclass
from typing import List, Literal

RegleType = Literal["score", "desactivation", "reduction"]


@dataclass
class Regle:
    formule: str
    type: RegleType
    description: str = ""


@dataclass
class Personnalisation:
    id: str
    titre: str
    regles: List[Regle]
    description: str = ""
