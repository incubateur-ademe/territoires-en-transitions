from typing import List, Generic, T

from data_layer.repositories import EpciRepository, ActionStatutRepository
from models.action_statut import ActionStatut
from models.client_epci import ClientEpci


class InMemoryRepository(Generic[T]):
    def __init__(self) -> None:
        super().__init__()
        self.elements = list[T]()


class EpciInMemoryRepository(InMemoryRepository[ClientEpci], EpciRepository):
    def list_epci(self) -> List[ClientEpci]:
        return self.elements


class ActionStatutInMemoryRepository(
    InMemoryRepository[ActionStatut], ActionStatutRepository
):
    def list_action_statut_of_epci(self, epci_id: int) -> List[ActionStatut]:
        return [statut for statut in self.elements if statut.epci_id == epci_id]
