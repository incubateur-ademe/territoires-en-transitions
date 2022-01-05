import abc
from typing import List

from business.core.domain.models.generated.action_statut_update_event_read import (
    ActionStatutUpdateEventRead,
)


class AbstractActionStatutUpdateEventRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def get_unprocessed_events(self) -> List[ActionStatutUpdateEventRead]:
        raise NotImplementedError


class InMemoryActionStatutUpdateEventRepository(
    AbstractActionStatutUpdateEventRepository
):
    def __init__(
        self, unprocessed_events: List[ActionStatutUpdateEventRead] = None
    ) -> None:
        self._unprocessed_events = unprocessed_events or []

    def get_unprocessed_events(self) -> List[ActionStatutUpdateEventRead]:
        return self._unprocessed_events
