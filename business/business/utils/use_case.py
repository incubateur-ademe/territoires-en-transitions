import abc
from typing import Type, Any

from business.core.domain.models.event import DomainEvent


class UseCase(abc.ABC):
    @abc.abstractmethod
    def execute(self, trigger: DomainEvent) -> Any:
        pass
