from typing import List, Tuple, Any, Type

from lark import Transformer

from business.personnalisation.engine.formule import FormuleABC, FormuleError
from business.personnalisation.engine.models import Question


class FormuleChecker(FormuleABC, Transformer):
    """In charge of checking formules are correct"""

    def __init__(self, questions: List[Question], visit_tokens: bool = True) -> None:
        Transformer.__init__(self, visit_tokens)
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

    def if_then(self, node: Tuple[Any, Any, Any]):
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
