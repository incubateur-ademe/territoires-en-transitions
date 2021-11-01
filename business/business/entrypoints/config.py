from typing import List

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


class PrepareBusError(Exception):
    pass


class Config:
    def __init__(
        self,
        referentiel_repo: AbstractReferentielRepository,
        score_repo: AbstractActionScoreRepository,
        statuses_repo: AbstractActionStatusRepository,
        domain_message_bus: AbstractDomainMessageBus,
        data_layer_event_bus: AbstractDataLayerEventBus,
    ) -> None:
        self.referentiel_repo = referentiel_repo
        self.score_repo = score_repo
        self.statuses_repo = statuses_repo
        self.domain_message_bus = domain_message_bus
        self.data_layer_event_bus = data_layer_event_bus

    def prepare_use_cases(self) -> List[UseCase]:

        return [
            ComputeReferentielScoresForEpci(
                self.domain_message_bus, self.referentiel_repo, self.statuses_repo
            ),
            ConvertMarkdownReferentielNodeToEntities(self.domain_message_bus),
            ParseMarkdownReferentielFolder(self.domain_message_bus),
            StoreReferentiel(self.domain_message_bus, self.referentiel_repo),
            StoreScoresForEpci(self.domain_message_bus, score_repo=self.score_repo),
        ]
