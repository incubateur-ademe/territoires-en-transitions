from typing import List

from lark import Tree
from lark.visitors import Interpreter

from business.personnalisation.engine.formule import FormuleABC, Reponse, ReponseMissing


class FormuleInterpreter(FormuleABC, Interpreter):
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
