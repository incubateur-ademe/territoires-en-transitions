import abc
from typing import Any

from business.utils.domain_message_bus import DomainEvent


class UseCase(abc.ABC):
    @abc.abstractmethod
    def execute(self, trigger: DomainEvent) -> Any:
        pass
