from dataclasses import dataclass
from typing import Literal, Optional, List
from .actions import ActionId

QuestionType = Literal["choix", "binaire", "proportion"]
CollectiviteType = Literal["EPCI", "commune"]


@dataclass
class Choix:
    """Choix as saved in the JSON"""

    id: str
    formulation: str
    ordonnancement: Optional[int]


@dataclass
class Question:
    """Question as saved in the JSON"""

    id: str
    formulation: str
    description: str
    thematique_id: str
    action_ids: List[ActionId]
    type: QuestionType
    ordonnnancement: Optional[int]
    types_collectivites_concernees: Optional[List[CollectiviteType]]
    choix: Optional[List[Choix]] = None
