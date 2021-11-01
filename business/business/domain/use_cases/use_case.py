import abc
from typing import Type, Any

from business.domain.models import commands


class UseCase(abc.ABC):
    @abc.abstractmethod
    def execute(self, command: Type[commands.DomainCommand]) -> Any:
        pass
