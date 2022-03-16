from dataclasses import dataclass, asdict
from typing import Literal, Set

from business.personnalisation.engine.math import MathTransformer


@dataclass
class Identite:
    type: Set[Literal["syndicat", "commune"]]
    population: Set[Literal["moins_de_100000"]]
    localisation: Set[Literal["DOM"]]


@dataclass
class Reponses:
    mobilite_1: Literal["OUI", "NON"]
    mobilite_2: Literal["mobilite_2_a", "mobilite_2_b", "mobilite_2_c"]


@dataclass
class Context:
    identite: Identite
    reponses: Reponses


class FormuleTransformer(MathTransformer):

    def __init__(self, context: Context, visit_tokens: bool = True) -> None:
        self.reponses = asdict(context.reponses)
        self.identite = asdict(context.identite)
        super().__init__(visit_tokens)

    def reponse_comparison(self, n):
        """
        :returns True if the reponse at key matches the value.
        :raise a key error if the key does not exist
        """
        (key, value) = n
        reponse = self.reponses[key]
        return reponse == value

    @staticmethod
    def identifier(n):
        """returns token content as the identifier is a dict key"""
        return n[0].value

    @staticmethod
    def string(n):
        """returns token content"""
        return n[0].value

    @staticmethod
    def true(_):
        return True

    @staticmethod
    def false(_):
        return False
