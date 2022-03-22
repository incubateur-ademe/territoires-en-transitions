from dataclasses import dataclass
from typing import List, Literal, Optional, Set, Union

from business.referentiel.domain.models.question import QuestionType


@dataclass
class Reponse:
    id: str
    value: Union[str, float, bool]


@dataclass
class Question:
    id: str
    type: QuestionType
    choix_ids: Optional[List[str]] = None


IdentiteTypeOption = Literal["syndicat", "commune"]
IdentitePopulationOption = Literal["moins_de_100000"]
IdentiteLocalisationOption = Literal["DOM"]


@dataclass
class IdentiteOptions:
    type: List[IdentiteTypeOption]  # = ["syndicat", "commune"]
    population: List[IdentitePopulationOption]  # = ["moins_de_100000"]
    localisation: List[IdentiteLocalisationOption]  # = ["DOM"]


@dataclass
class IdentiteCollectivite:
    type: Set[IdentiteTypeOption]
    population: Set[IdentitePopulationOption]
    localisation: Set[IdentiteLocalisationOption]
