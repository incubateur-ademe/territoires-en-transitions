from dataclasses import dataclass
from typing import Literal, Optional, List
from .actions import ActionId

QuestionType = Literal["choix", "binaire", "proportion"]
CollectiviteType = Literal["EPCI", "commune"]


@dataclass
class Choix:
    """Choix as saved in the JSON"""

    id: str
    formulation: str = ""
    ordonnancement: Optional[int] = None


@dataclass
class Question:
    """Question as saved in the JSON"""

    id: str
    type: QuestionType
    action_ids: List[ActionId]
    formulation: str = ""
    description: str = ""
    thematique_id: str = ""
    ordonnnancement: Optional[int] = None
    types_collectivites_concernees: Optional[List[CollectiviteType]] = None
    choix: Optional[List[Choix]] = None
