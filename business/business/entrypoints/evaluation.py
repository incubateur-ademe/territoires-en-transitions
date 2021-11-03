from typing import List, Dict, Type

from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
)
from business.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.domain.ports.action_score_repo import (
    AbstractActionScoreRepository,
)
from business.domain.ports.action_status_repo import (
    AbstractActionStatusRepository,
)
from business.domain.ports.data_layer_event_bus import (
    AbstractDataLayerEventBus,
)
from business.domain.use_cases import *
from business.domain.models import events, commands
from .config import Config

# 1. Define Handlers
EVENT_HANDLERS: Dict[Type[events.DomainEvent], List[Type[commands.DomainCommand]]] = {
    events.ActionStatusUpdatedForEpci: [commands.ComputeReferentielScoresForEpci],
    events.ReferentielScoresForEpciComputed: [commands.StoreScoresForEpci],
}

COMMAND_HANDLERS: Dict[Type[commands.DomainCommand], Type[UseCase]] = {
    commands.ComputeReferentielScoresForEpci: ComputeReferentielScoresForEpci,
    commands.StoreScoresForEpci: StoreScoresForEpci,
}

# 2. Define Config
class EvaluationConfig(Config):
    def __init__(
        self,
        referentiel_repo: AbstractReferentielRepository,
        score_repo: AbstractActionScoreRepository,
        statuses_repo: AbstractActionStatusRepository,
        domain_message_bus: AbstractDomainMessageBus,
        data_layer_event_bus: AbstractDataLayerEventBus,
    ) -> None:
        super().__init__(domain_message_bus)
        self.referentiel_repo = referentiel_repo
        self.score_repo = score_repo
        self.statuses_repo = statuses_repo
        self.data_layer_event_bus = data_layer_event_bus

    def prepare_use_cases(self) -> List[UseCase]:

        return [
            ComputeReferentielScoresForEpci(
                self.domain_message_bus, self.referentiel_repo, self.statuses_repo
            ),
            StoreScoresForEpci(self.domain_message_bus, score_repo=self.score_repo),
        ]


# 3. Prepare domain bus


# 4. Launch data layer listener
