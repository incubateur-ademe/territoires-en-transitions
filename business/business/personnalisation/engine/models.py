from dataclasses import dataclass, field
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


IdentiteTypeOption = Literal["syndicat", "commune", "EPCI", "syndicat_traitement"]
IdentitePopulationOption = Literal["moins_de_5000", "moins_de_10000", "moins_de_100000"]
IdentiteLocalisationOption = Literal["DOM"]


@dataclass
class IdentiteCollectivite:
    type: Set[IdentiteTypeOption] = field(default_factory=lambda: set())
    population: Set[IdentitePopulationOption] = field(default_factory=lambda: set())
    localisation: Set[IdentiteLocalisationOption] = field(default_factory=lambda: set())
