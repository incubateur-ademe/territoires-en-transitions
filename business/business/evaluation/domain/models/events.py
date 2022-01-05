from dataclasses import dataclass
from typing import List

from business.evaluation.domain.models.action_score import ActionScore
from business.core.domain.models.referentiel import ActionReferentiel
from business.core.domain.models.event import DomainEvent, DomainFailureEvent


@dataclass
class ActionStatutUpdatedForCollectivite(DomainEvent):
    collectivite_id: int
    referentiel: ActionReferentiel
    created_at: str


@dataclass
class ReferentielScoresForCollectiviteComputed(DomainEvent):
    collectivite_id: int
    referentiel: ActionReferentiel
    scores: List[ActionScore]


@dataclass
class ReferentielScoresForCollectiviteComputationFailed(DomainFailureEvent):
    pass


@dataclass
class ScoresForCollectiviteStored(DomainEvent):
    collectivite_id: int


@dataclass
class ScoresStorageForCollectiviteFailed(DomainFailureEvent):
    pass


@dataclass
class RealtimeEventWithWrongFormatObserved(DomainFailureEvent):
    pass
