import abc
from typing import List, Optional

from business.evaluation.domain.models.action_statut import ActionStatut
from business.utils.models.actions import ActionReferentiel


class AbstractActionStatutRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def get_all_for_collectivite(
        self, collectivite_id: int, referentiel: ActionReferentiel
    ) -> List[ActionStatut]:
        raise NotImplementedError


class InMemoryActionStatutRepository(AbstractActionStatutRepository):
    def __init__(self, entities: Optional[List[ActionStatut]] = None) -> None:
        self._entities = entities or []

    def get_all_for_collectivite(
        self, collectivite_id: int, referentiel: ActionReferentiel
    ) -> List[ActionStatut]:
        return self._entities

    # For test purposes only

    def add_entities(self, entities: List[ActionStatut]):
        self._entities += entities

    @property
    def entities(self) -> List[ActionStatut]:
        return self._entities
