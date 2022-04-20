from typing import List, Tuple, Any, Type

from lark import Transformer

from business.personnalisation.engine.formule import FormuleABC, FormuleError
from business.personnalisation.models import (
    Question,
    IdentiteTypeOption,
    IdentitePopulationOption,
    IdentiteLocalisationOption,
)
from business.utils.action_id import ActionId

TypedValue = Tuple[Type, Any]
Arg1 = Tuple[TypedValue]
Arg2 = Tuple[TypedValue, TypedValue]
Arg3 = Tuple[TypedValue, TypedValue, TypedValue]


class FormuleChecker(FormuleABC, Transformer):
    """In charge of checking formules are correct"""

    def __init__(
        self,
        questions: List[Question],
        action_ids: List[ActionId],
        visit_tokens: bool = True,
    ) -> None:
        Transformer.__init__(self, visit_tokens)
        self.questions = {question.id: question for question in questions}
        self.action_ids = action_ids

    def reponse_comparison(self, node: Arg2) -> TypedValue:
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
        return bool, "reponse"

    def reponse_value(self, node: Arg1) -> TypedValue:
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
        return float, "reponse"

    def score_value(self, node: Arg1) -> TypedValue:
        """Compute score of action
        Raises FormuleError if action_id does not exist
        """
        action_id = node[0][1]
        if action_id not in self.action_ids:
            raise FormuleError(f"Id de l'action inconnue: {action_id}.")
        return str, "score"

    def identite(self, node: Arg2) -> TypedValue:
        """Returns true if the value is contained by the identite property
        Raises FormuleError either value or property does not match.
        """
        identifier = node[0][1]
        option = node[1][1]

        if identifier == "type":
            if option not in IdentiteTypeOption.__args__:  # type: ignore
                raise FormuleError(f"{option} is not a valid '{identifier}'.")
            return bool, "identite"

        elif identifier == "population":
            if option not in IdentitePopulationOption.__args__:  # type: ignore
                raise FormuleError(f"{option} is not a valid '{identifier}'.")
            return bool, "identite"

        elif identifier == "localisation":
            if option not in IdentiteLocalisationOption.__args__:  # type: ignore
                raise FormuleError(f"{option} is not a valid '{identifier}'.")
            return bool, "identite"

        raise FormuleError(f"{identifier} is not a valid property.")

    def if_then(self, node: Arg2) -> TypedValue:
        test, if_suite = node
        if test:
            return if_suite
        return type(None), "if"

    def if_then_else(self, node: Arg3) -> TypedValue:
        test, if_suite, else_suite = node
        if test:
            return if_suite
        return else_suite

    def logic_or(self, node: Arg2) -> TypedValue:
        return node[0] or node[1]

    def logic_and(self, node: Arg2) -> TypedValue:
        return node[0] and node[1]

    def min(self, node: Arg2) -> TypedValue:
        return self.math("min", node)

    def max(self, node: Any):
        return self.math("max", node)

    def mul(self, node: Any):
        return self.math("mul", node)

    def div(self, node: Any):
        return self.math("div", node)

    def add(self, node: Any):
        return self.math("add", node)

    def sub(self, node: Any):
        return self.math("sub", node)

    @staticmethod
    def true(_):
        return bool, True

    @staticmethod
    def false(_):
        return bool, False

    @staticmethod
    def number(n):
        return float, float(n[0].value)

    @staticmethod
    def identifier(n) -> TypedValue:
        """returns token content as the identifier is a dict key"""
        return str, n[0].value

    @staticmethod
    def string(n) -> TypedValue:
        """returns token content"""
        return str, n[0].value

    @staticmethod
    def math(function_name: str, node: Arg2):
        if node[0][0] not in [float, str] or node[1][0] != float:
            raise FormuleError(
                f"{function_name} ne prend que des arguments de type nombre."
                f"\n{function_name} ({node[0][1]}, {node[0][1]}) n'est pas valide."
            )
        return float, function_name
