import abc
from typing import List

from business.evaluation.domain.models.unprocessed_action_statut_update_event_read import (
    UnprocessedActionStatutUpdateEventRead,
)


class AbstractActionStatutUpdateEventRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def get_unprocessed_events(self) -> List[UnprocessedActionStatutUpdateEventRead]:
        raise NotImplementedError


class InMemoryActionStatutUpdateEventRepository(
    AbstractActionStatutUpdateEventRepository
):
    def __init__(
        self, unprocessed_events: List[UnprocessedActionStatutUpdateEventRead] = None
    ) -> None:
        self._unprocessed_events = unprocessed_events or []

    def get_unprocessed_events(self) -> List[UnprocessedActionStatutUpdateEventRead]:
        return self._unprocessed_events
