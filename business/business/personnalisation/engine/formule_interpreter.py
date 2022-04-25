import operator
from dataclasses import asdict
from typing import List, Optional

from lark import Tree
from lark.visitors import Interpreter

from business.personnalisation.engine.formule import FormuleABC, ReponseMissing
from business.personnalisation.models import IdentiteCollectivite, Reponse


class FormuleInterpreter(Interpreter):
    def if_then(self, tree: Tree):
        test = self.visit(tree.children[0])
        if test:
            return self.visit(tree.children[1])
        return None

    def if_then_else(self, tree: Tree):
        test = self.visit(tree.children[0])
        if test:
            return self.visit(tree.children[1])
        return self.visit(tree.children[2])

    def logic_or(self, tree: Tree):
        return self.visit(tree.children[0]) or self.visit(tree.children[1])

    def logic_and(self, tree: Tree):
        return self.visit(tree.children[0]) and self.visit(tree.children[1])

    def min(self, tree: Tree):
        x1 = self.visit(tree.children[0])
        x2 = self.visit(tree.children[1])
        if isinstance(x1, float) and isinstance(x2, float):
            return min(x1, x2)
        return f"min({x1}, {x2})"

    def max(self, tree: Tree):
        x1 = self.visit(tree.children[0])
        x2 = self.visit(tree.children[1])
        if isinstance(x1, float) and isinstance(x2, float):
            return max(x1, x2)
        return f"max({x1}, {x2})"

    def mul(self, tree: Tree):
        return operator.mul(self.visit(tree.children[0]), self.visit(tree.children[1]))

    def div(self, tree: Tree):
        return operator.truediv(
            self.visit(tree.children[0]), self.visit(tree.children[1])
        )

    def add(self, tree: Tree):
        return operator.add(self.visit(tree.children[0]), self.visit(tree.children[1]))

    def sub(self, tree: Tree):
        return operator.sub(self.visit(tree.children[0]), self.visit(tree.children[1]))

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


class ReponsesInterpreter(FormuleABC, FormuleInterpreter):
    """In charge of checking formules are correct"""

    def __init__(
        self,
        reponses: Optional[List[Reponse]] = None,
        identite=IdentiteCollectivite(),
        visit_tokens: bool = True,
    ) -> None:
        super().__init__(visit_tokens)
        self.identite_collectivite = asdict(identite)
        self.reponses = (
            {reponse.id: reponse.value for reponse in reponses} if reponses else {}
        )

    def reponse_comparison(self, tree: Tree):
        """Compute reponse to questions of type choix
        Returns True if the reponse at key matches the value.
        Returns False if reponse can't be found
        """
        (question_id, compared_choix_id) = self.visit_children(tree)
        if question_id not in self.reponses:
            return False
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

    def score_value(self, tree: Tree):
        """Compute score of an action
        Returns the value of scores at given key
        Returns None if score can't be found
        """
        action_id = self.visit_children(tree)[0]
        return f"score({action_id})"

    def identite(self, tree: Tree):
        identifier, value = self.visit_children(tree)
        if identifier not in self.identite_collectivite:
            raise KeyError(
                f"Key {identifier} is not valid for 'identite', have you ran the formule checker?"
            )
        return value in self.identite_collectivite[identifier]
