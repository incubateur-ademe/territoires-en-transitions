from dataclasses import dataclass, field
from typing import List, Literal, Optional, Set, Union

from lark import ParseTree

from business.referentiel.domain.models.question import QuestionType


@dataclass
class Reponse:
    """Reponse to a question."""

    id: str
    value: Union[str, float]


@dataclass
class Question:
    """Question asked to a collectivite"""

    id: str
    type: QuestionType
    choix_ids: Optional[List[str]] = None


IdentiteTypeOption = Literal["syndicat", "commune", "EPCI", "syndicat_traitement"]
IdentitePopulationOption = Literal[
    "moins_de_5000",
    "moins_de_10000",
    "moins_de_20000",
    "moins_de_50000",
    "moins_de_100000",
    "plus_de_100000",
]
IdentiteLocalisationOption = Literal["DOM"]


@dataclass
class IdentiteCollectivite:
    """Caracteristiques of a collectivite used in identite function"""

    type: Set[IdentiteTypeOption] = field(default_factory=lambda: set())
    population: Set[IdentitePopulationOption] = field(default_factory=lambda: set())
    localisation: Set[IdentiteLocalisationOption] = field(default_factory=lambda: set())


@dataclass
class ActionPersonnalisationConsequence:
    """Computed consequence for an action"""

    desactive: Optional[bool] = None
    potentiel_perso: Optional[float] = None
    score_formule: Optional[str] = None


@dataclass
class ActionPersonnalisationParsedRegles:
    """Parsed regles for an action"""

    desactivation: Optional[ParseTree] = None
    reduction: Optional[ParseTree] = None
    score: Optional[ParseTree] = None
