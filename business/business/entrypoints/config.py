import abc
from typing import List
from business.domain.ports.domain_message_bus import AbstractDomainMessageBus

from business.domain.use_cases import *


class PrepareBusError(Exception):
    pass


class Config(abc.ABC):
    def __init__(self, domain_message_bus: AbstractDomainMessageBus) -> None:
        self.domain_message_bus = domain_message_bus

    @abc.abstractmethod
    def prepare_use_cases(self) -> List[UseCase]:
        raise NotImplementedError
