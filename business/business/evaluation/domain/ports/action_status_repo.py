import abc
from typing import List

from business.evaluation.domain.models.action_statut import ActionStatut
from business.core.domain.models.referentiel import Referentiel


class AbstractActionStatutRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def get_all_for_epci(
        self, epci_id: int, referentiel: Referentiel
    ) -> List[ActionStatut]:
        raise NotImplementedError


class InMemoryActionStatutRepository(AbstractActionStatutRepository):
    def __init__(self, entities: List[ActionStatut] = None) -> None:
        self._entities = entities or []

    def get_all_for_epci(
        self, epci_id: int, referentiel: Referentiel
    ) -> List[ActionStatut]:
        return self._entities

    # For test purposes only

    def add_entities(self, entities=List[ActionStatut]):
        self._entities += entities

    @property
    def entities(self) -> List[ActionStatut]:
        return self._entities
