import abc
from dataclasses import dataclass
from typing import Any, Literal, Optional, Set, Tuple, Type, Union, List

from lark import Transformer
from lark.visitors import Interpreter
from lark.tree import Tree

from business.personnalisation.engine.math import MathTransformer
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
    def reponse_comparison(self, node: Tuple[Any, Any]):
        """Compute reponse to questions of type choix"""
        raise NotImplementedError

    @abc.abstractmethod
    def reponse_value(self, node: Tuple[Any]):
        """Compute reponse to questions of type proportion or binaire"""
        raise NotImplementedError

    @abc.abstractmethod
    def if_statement(self, node: Tuple[Any, Any, Any]):
        raise NotImplementedError


class FormuleChecker(FormuleABC, Transformer):
    """In charge of checking formules are correct"""

    def __init__(self, questions: List[Question], visit_tokens: bool = True) -> None:
        super(Transformer, self).__init__(visit_tokens)
        self.questions = {question.question_id: question for question in questions}

    def reponse_comparison(self, node: Tuple[Any, Any]):
        """Compute reponse to questions of type choix
        Returns True if the reponse at key matches the value.
        Raises FormuleError if question_id or choix_id does not exist
        """
        (question_id, compared_choix_id) = (node[0][1], node[1][1])
        if question_id not in self.questions:
            raise FormuleError(f"Id de question inconnue: {question_id}.")
        question_type = self.questions[question_id].type
        if question_type == "proportion":
            raise FormuleError(
                f"La question d'id {question_id} est de type proportion, donc la fonction réponse n'attend qu'un argument."
            )
        allowed_choix_ids = (
            self.questions[question_id].choix_ids or []
            if question_type == "choix"
            else ["OUI", "NON"]
        )
        if compared_choix_id not in allowed_choix_ids:
            raise FormuleError(
                f"L'id de choix {compared_choix_id} est inconnu pour la question {question_id}. Choix possibles : {', '.join(allowed_choix_ids)}"
            )
        return (bool, "reponse")

    def reponse_value(self, node: Tuple[Any]):
        """Compute reponse to questions of type proportion or binaire
        Raises FormuleError if question_id does not exist
        """
        question_id = node[0][1]
        if question_id not in self.questions:
            raise FormuleError(f"Id de question inconnue: {question_id}.")
        question_type = self.questions[question_id].type
        if question_type in ["choix", "binaire"]:
            raise FormuleError(
                f"La question d'id {question_id} est de type {question_type}, donc la fonction réponse attend deux arguments."
            )
        return (float, "reponse")

    def if_statement(self, node: Tuple[Any, Any, Any]):
        test, if_return, else_return = node
        if test:
            return if_return
        else:
            return else_return

    @staticmethod
    def identifier(n) -> Tuple[Type[str], str]:
        """returns token content as the identifier is a dict key"""
        return (str, n[0].value)

    @staticmethod
    def string(n) -> Tuple[Type[str], str]:
        """returns token content"""
        return (str, n[0].value)


class FormuleInterpreter(Interpreter):
    """In charge of checking formules are correct"""

    def __init__(self, reponses: List[Reponse], visit_tokens: bool = True) -> None:
        Interpreter.__init__(visit_tokens)
        self.reponses = {reponse.question_id: reponse.value for reponse in reponses}

    def reponse_comparison(self, tree: Tree):
        """Compute reponse to questions of type choix
        Returns True if the reponse at key matches the value.
        Raise ReponseMissing if reponse can't be found
        """
        (question_id, compared_choix_id) = self.visit_children(tree)
        if question_id not in self.reponses:
            raise ReponseMissing(f"No reponse for question {question_id}")
        reponse_choix_id = self.reponses[question_id]
        return reponse_choix_id == compared_choix_id

    def reponse_value(self, tree: Tree):
        """Compute reponse to questions of type proportion or binaire
        Returns the value responses at given key
        Returns None if reponse can't be found
        """
        question_id = self.visit_children(tree)[0]
        if question_id not in self.reponses:
            raise ReponseMissing(f"No reponse for question {question_id}")
        return self.reponses[question_id]


    def if_then(self, tree: Tree):
        test = self.visit(tree.children[0])
        if test:
            return self.visit(tree.children[1])
        return None


    @staticmethod
    def identifier(tree):
        """returns token content as the identifier is a dict key"""
        return tree.children[0].value

    @staticmethod
    def string(tree):
        """returns token content"""
        return tree.children[0].value

    @staticmethod
    def true(_):
        return True

    @staticmethod
    def false(_):
        return False

    @staticmethod
    def number(tree):
        return float(tree.children[0].value)
