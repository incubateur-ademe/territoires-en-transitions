import abc
from typing import List

from models.action_statut import ActionStatut
from models.client_epci import ClientEpci


class EpciRepository(abc.ABC):
    @abc.abstractmethod
    def list_epci(self) -> List[ClientEpci]:
        pass


class ActionStatutRepository(abc.ABC):
    @abc.abstractmethod
    def list_action_statut_of_epci(self, epci_id: int) -> List[ActionStatut]:
        pass
