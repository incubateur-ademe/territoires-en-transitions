from dataclasses import dataclass
from typing import List

from business.evaluation.domain.models.action_score import ActionScore
from business.core.domain.models.referentiel import Referentiel
from business.core.domain.models.event import DomainEvent, DomainFailureEvent


@dataclass
class ActionStatutUpdatedForEpci(DomainEvent):
    epci_id: int
    referentiel: Referentiel
    created_at: str


@dataclass
class ReferentielScoresForEpciComputed(DomainEvent):
    epci_id: int
    referentiel: Referentiel
    scores: List[ActionScore]


@dataclass
class ReferentielScoresForEpciComputationFailed(DomainFailureEvent):
    pass


@dataclass
class ScoresForEpciStored(DomainEvent):
    epci_id: int


@dataclass
class ScoresStorageForEpciFailed(DomainFailureEvent):
    pass


@dataclass
class RealtimeEventWithWrongFormatObserved(DomainFailureEvent):
    pass
