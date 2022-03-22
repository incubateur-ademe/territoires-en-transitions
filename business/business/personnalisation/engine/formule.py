import abc
from dataclasses import dataclass
from typing import Any, Literal, Optional, Set, Union, List

from business.referentiel.domain.models.question import QuestionType


class FormuleError(Exception):
    pass


class ReponseMissing(Exception):
    pass


# @dataclass
# class Identite:
#     type: Set[Literal["syndicat", "commune"]]
#     population: Set[Literal["moins_de_100000"]]
#     localisation: Set[Literal["DOM"]]


@dataclass
class Reponse:
    question_id: str
    value: Union[str, float, bool]


@dataclass
class Question:
    question_id: str
    type: QuestionType
    choix_ids: Optional[List[str]] = None


@dataclass
class Context:
    # identite: Identite
    reponses: List[Reponse]
    questions: List[Question]


class FormuleABC(abc.ABC):
    @abc.abstractmethod
    def reponse_comparison(self, node_or_tree: Any):
        """Compute reponse to questions of type choix"""
        raise NotImplementedError

    @abc.abstractmethod
    def reponse_value(self, node_or_tree: Any):
        """Compute reponse to questions of type proportion or binaire"""
        raise NotImplementedError

    def if_then(self, node_or_tree: Any):
        raise NotImplementedError
