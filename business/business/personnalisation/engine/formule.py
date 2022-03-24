import abc
from typing import Any

from lark import Transformer


class IdentiteError(Exception):
    pass


class FormuleError(Exception):
    pass


class ReponseMissing(Exception):
    pass


class FormuleABC(Transformer, abc.ABC):
    def __init__(self, visit_tokens: bool = True) -> None:
        super().__init__(visit_tokens)

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
